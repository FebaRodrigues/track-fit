// controllers/paymentController.js
const Payment = require('../models/Payment');
const User = require('../models/User');
const Membership = require('../models/Membership');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const otpStore = new Map();

// Initialize Stripe with proper error handling
let stripe;
try {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is not defined in environment variables');
    throw new Error('STRIPE_SECRET_KEY is not configured. Please check your .env file.');
  }
  
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
  });
  console.log('Stripe initialized successfully with key:', process.env.STRIPE_SECRET_KEY.substring(0, 7) + '...');
} catch (error) {
  console.error('Failed to initialize Stripe:', error.message);
}

// Helper function to update user membership
const updateUserMembership = async (userId, membershipId) => {
  try {
    // First, expire any existing active memberships
    const expireResult = await Membership.updateMany(
      { userId: userId, status: 'Active', _id: { $ne: membershipId } },
      { status: 'Expired' }
    );
    console.log('Expired existing memberships:', expireResult);

    // Get the membership to update
    const membership = await Membership.findById(membershipId);
    if (!membership) {
      throw new Error(`Membership with ID ${membershipId} not found`);
    }

    // Calculate end date based on duration
    const endDate = new Date();
    if (membership.duration === 'Monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (membership.duration === 'Quarterly') {
      endDate.setMonth(endDate.getMonth() + 3);
    } else if (membership.duration === 'Yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      // Default to 1 month if duration not recognized
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Then activate this membership
    const updatedMembership = await Membership.findByIdAndUpdate(
      membershipId,
      { 
        status: 'Active',
        startDate: new Date(),
        endDate: endDate
      },
      { new: true }
    );
    
    console.log('Activated membership:', updatedMembership);
    return updatedMembership;
  } catch (error) {
    console.error('Error in updateUserMembership:', error);
    throw error;
  }
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via Gmail
const sendOTP = async (email, otp) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email configuration is missing');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'TrackFit - Payment Verification OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Payment Verification</h2>
        <p>Your one-time password (OTP) for payment verification is:</p>
        <h1 style="color: #007bff; font-size: 32px;">${otp}</h1>
        <p>This OTP will expire in 5 minutes.</p>
        <p style="color: #666; font-size: 12px;">If you didn't request this OTP, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendPaymentOTP = async (req, res) => {
  const { userId, email } = req.body;
  try {
    console.log('Sending OTP with data:', req.body);
    
    if (!stripe) {
      throw new Error('Stripe is not properly initialized');
    }

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Use provided email or fall back to user's email
    const emailToUse = email || user.email;
    if (!emailToUse) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Generate OTP
    const otp = generateOTP();
    console.log('Generated OTP:', otp, 'for user:', userId);
    
    // Store OTP in session
    req.session.otp = { 
      code: otp, 
      expires: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
      userId 
    };
    
    // Save session explicitly to ensure it's stored
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
        return res.status(500).json({ message: 'Failed to save OTP session' });
      }
      
      console.log('OTP session saved:', req.session.otp);
    });

    // Send OTP via email
    await sendOTP(emailToUse, otp);
    
    return res.status(200).json({ 
      message: 'OTP sent successfully',
      expiresAt: req.session.otp.expires
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({ message: error.message || 'Failed to send OTP' });
  }
};

const verifyPaymentOTP = async (req, res) => {
  const { otp, userId } = req.body;
  
  try {
    console.log('Verifying OTP with data:', req.body);
    
    // Validate input
    if (!otp || !userId) {
      return res.status(400).json({ message: 'OTP and userId are required' });
    }

    // Check if OTP session exists
    if (!req.session?.otp) {
      return res.status(400).json({ message: 'No OTP session found' });
    }
    
    console.log('Session OTP data:', req.session.otp);
    
    if (req.session.otp.userId !== userId) {
      return res.status(400).json({ message: 'OTP session user mismatch' });
    }

    const { code, expires } = req.session.otp;
    
    // Check if OTP is expired
    if (new Date() > new Date(expires)) {
      delete req.session.otp;
      return res.status(400).json({ message: 'OTP expired' });
    }

    // Validate OTP
    const otpString = otp.toString();
    console.log('Comparing OTPs:', { sessionOTP: code, providedOTP: otpString });
    
    if (code !== otpString) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Clear OTP session
    delete req.session.otp;

    // Find any pending membership for this user
    const pendingMembership = await Membership.findOne({ 
      userId, 
      status: 'Pending' 
    }).sort({ createdAt: -1 });

    if (pendingMembership) {
      console.log('Found pending membership:', pendingMembership);
      
      // Return success response with membership info but don't activate it yet
      // The membership will be activated after successful payment
      return res.status(200).json({ 
        message: 'OTP verified successfully',
        pendingMembership: pendingMembership
      });
    } else {
      console.log('No pending membership found for user:', userId);
      // Return success response without membership info
      return res.status(200).json({ 
        message: 'OTP verified successfully'
      });
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({ message: error.message || 'Failed to verify OTP' });
  }
};

const createPayment = async (req, res) => {
  try {
    const { amount, type, membershipId, userId, planType, paymentId, bookingId, description } = req.body;

    console.log('Creating payment with data:', req.body);
    
    // Validate Stripe initialization
    if (!stripe) {
      console.error('Stripe is not properly initialized');
      return res.status(500).json({ message: 'Payment service is not available' });
    }

    // Validate required fields
    if (!type || !userId) {
      console.error('Missing required payment fields:', { type, userId });
      return res.status(400).json({ message: 'Missing required payment information' });
    }

    // Set default amount for SPA services if missing or invalid
    let paymentAmount = amount;
    if (type === 'SpaService' && (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0)) {
      console.log('Using default amount (499) for SPA service payment');
      paymentAmount = 499;
    } else if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) {
      console.error('Invalid amount value:', amount);
      return res.status(400).json({ message: 'Invalid amount value' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found with ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Only check for membership if membershipId is provided and type is Membership
    let membership = null;
    if (type === 'Membership' && membershipId) {
      membership = await Membership.findById(membershipId);
      if (!membership) {
        console.error(`Membership with ID ${membershipId} not found`);
        return res.status(404).json({ message: 'Membership not found' });
      } else {
        console.log('Found membership:', membership);
      }
    }
    
    // Check for SPA booking if type is SpaService and bookingId is provided
    let spaBooking = null;
    if (type === 'SpaService' && bookingId) {
      // Import the SpaBooking model dynamically to avoid circular dependencies
      const { SpaBooking } = require('../models/Spa');
      spaBooking = await SpaBooking.findById(bookingId);
      if (!spaBooking) {
        console.error(`SPA booking with ID ${bookingId} not found`);
        return res.status(404).json({ message: 'SPA booking not found' });
      } else {
        console.log('Found SPA booking:', spaBooking);
      }
    }

    // Format amount properly
    const amountInCents = Math.round(Number(paymentAmount) * 100);
    
    // Verify client URL is set
    if (!process.env.CLIENT_URL) {
      console.error('CLIENT_URL environment variable is not set');
      return res.status(500).json({ message: 'Server configuration error: CLIENT_URL not set' });
    }
    
    try {
      // Check if we're retrying an existing payment
      let existingPayment = null;
      if (paymentId) {
        existingPayment = await Payment.findById(paymentId);
        if (existingPayment) {
          console.log('Found existing payment to retry:', existingPayment);
          
          // If this is a SPA service payment, make sure we have the booking ID
          if (existingPayment.type === 'SpaService' && !bookingId && existingPayment.bookingId) {
            console.log('Using booking ID from existing payment:', existingPayment.bookingId);
            bookingId = existingPayment.bookingId;
            
            // Verify the booking exists
            const { SpaBooking } = require('../models/Spa');
            spaBooking = await SpaBooking.findById(bookingId);
            if (!spaBooking) {
              console.error(`SPA booking with ID ${bookingId} not found`);
              return res.status(404).json({ message: 'SPA booking not found' });
            } else {
              console.log('Found SPA booking from existing payment:', spaBooking);
            }
          }
          
          // If the payment has a temporary session ID, clear it so we create a new one
          if (existingPayment.stripeSessionId && existingPayment.stripeSessionId.startsWith('pending-')) {
            console.log('Payment has a temporary session ID, will create a new one');
            existingPayment.stripeSessionId = null;
          }
        }
      }
      
      // Check if there's already a pending payment for this membership or booking
      if (!existingPayment) {
        if (membershipId && type === 'Membership') {
          const pendingPayment = await Payment.findOne({
            membershipId,
            status: 'Pending'
          });
          
          if (pendingPayment) {
            console.log('Found existing pending membership payment:', pendingPayment);
            
            // If there's an existing Stripe session, use it
            if (pendingPayment.stripeSessionId) {
              // Check if the session is still valid
              try {
                const session = await stripe.checkout.sessions.retrieve(pendingPayment.stripeSessionId);
                if (session && session.status !== 'expired') {
                  return res.status(200).json({
                    sessionId: pendingPayment.stripeSessionId,
                    payment: pendingPayment
                  });
                }
              } catch (sessionError) {
                console.log('Session no longer valid, creating a new one');
              }
            }
            
            // If we're not explicitly retrying this payment, use it as our existing payment
            if (!existingPayment) {
              existingPayment = pendingPayment;
            }
          }
        } else if (bookingId && type === 'SpaService') {
          const pendingPayment = await Payment.findOne({
            bookingId,
            status: 'Pending'
          });
          
          if (pendingPayment) {
            console.log('Found existing pending SPA payment:', pendingPayment);
            
            // If there's an existing Stripe session, use it
            if (pendingPayment.stripeSessionId) {
              // Check if the session is still valid
              try {
                const session = await stripe.checkout.sessions.retrieve(pendingPayment.stripeSessionId);
                if (session && session.status !== 'expired') {
                  return res.status(200).json({
                    sessionId: pendingPayment.stripeSessionId,
                    payment: pendingPayment
                  });
                }
              } catch (sessionError) {
                console.log('Session no longer valid, creating a new one');
              }
            }
            
            // If we're not explicitly retrying this payment, use it as our existing payment
            if (!existingPayment) {
              existingPayment = pendingPayment;
            }
          }
        }
      }
      
      // Prepare product name and description based on payment type
      let productName = `${planType || 'Fitness'} ${type}`;
      let productDescription = `${planType || 'Standard'} ${type.toLowerCase()} for TrackFit`;
      
      // For SPA services, use the provided description or a default
      if (type === 'SpaService') {
        productName = description || 'SPA Service';
        productDescription = 'SPA service booking at TrackFit';
      }
      
      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'inr',
              product_data: {
                name: productName,
                description: productDescription,
              },
              unit_amount: amountInCents, // Convert to cents and ensure integer
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.CLIENT_URL}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
        metadata: {
          userId,
          type,
          membershipId: membershipId || '',
          planType: planType || '',
          bookingId: bookingId || '',
          paymentId: existingPayment ? existingPayment._id.toString() : ''
        }
      });

      console.log('Created Stripe session:', session.id);

      // Update existing payment or create a new one
      let payment;
      if (existingPayment) {
        // Update the existing payment with the new session ID
        existingPayment.stripeSessionId = session.id;
        await existingPayment.save();
        payment = existingPayment;
        console.log('Updated existing payment with new session ID:', payment);
      } else {
        // Create a new payment record
        payment = new Payment({
          userId,
          amount: paymentAmount,
          type,
          status: 'Pending',
          stripeSessionId: session.id,
          membershipId: type === 'Membership' ? membershipId : null,
          bookingId: type === 'SpaService' ? bookingId : null,
          planType: planType || null,
          description: description || null
        });

        await payment.save();
        console.log('Created new payment record:', payment);
        
        // If this is a SPA booking payment, update the booking with the payment ID
        if (type === 'SpaService' && bookingId && spaBooking) {
          spaBooking.paymentId = payment._id;
          await spaBooking.save();
          console.log('Updated SPA booking with payment ID:', payment._id);
        }
      }

      // Return the session ID to the client
      return res.status(200).json({ 
        sessionId: session.id,
        payment: payment
      });
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      return res.status(500).json({ 
        message: 'Payment processing error', 
        error: stripeError.message 
      });
    }
  } catch (error) {
    console.error('Payment creation error:', error);
    return res.status(500).json({ 
      message: 'Server error creating payment', 
      error: error.message 
    });
  }
};

const verifySession = async (req, res) => {
  try {
    const { session_id } = req.query;
    
    if (!session_id) {
      console.error('verifySession: No session ID provided');
      return res.status(400).json({ message: 'Session ID is required' });
    }
    
    console.log('verifySession: Verifying session:', session_id);
    
    // Validate Stripe initialization
    if (!stripe) {
      console.error('verifySession: Stripe is not properly initialized');
      return res.status(500).json({ message: 'Payment service is not available' });
    }
    
    // Retrieve session from Stripe
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(session_id);
      console.log('verifySession: Retrieved Stripe session:', session.id, 'with status:', session.payment_status);
    } catch (stripeError) {
      console.error('verifySession: Error retrieving Stripe session:', stripeError);
      return res.status(404).json({ 
        message: 'Could not retrieve session from Stripe',
        error: stripeError.message
      });
    }
    
    // Extract metadata
    const { userId, membershipId, planType, paymentId, bookingId } = session.metadata || {};
    console.log('verifySession: Session metadata:', { userId, membershipId, planType, paymentId, bookingId });
    
    // Find payment in our database
    let payment;
    
    // First try to find by paymentId if provided
    if (paymentId) {
      payment = await Payment.findById(paymentId);
      if (payment) {
        console.log('verifySession: Found payment by ID:', payment._id.toString());
      }
    }
    
    // If not found by ID, try to find by stripeSessionId
    if (!payment) {
      payment = await Payment.findOne({ stripeSessionId: session_id });
      if (payment) {
        console.log('verifySession: Found payment by stripeSessionId:', payment._id.toString());
      }
    }
    
    // If still not found, try to find by transaction ID (payment_intent)
    if (!payment && session.payment_intent) {
      payment = await Payment.findOne({ transactionId: session.payment_intent });
      if (payment) {
        console.log('verifySession: Found payment by transactionId:', payment._id.toString());
      }
    }
    
    // If payment not found, try to create one
    if (!payment) {
      console.log('verifySession: Payment not found for session:', session_id);
      
      // Try to create a payment if we have enough information
      if (userId) {
        try {
          // Handle membership payment
          if (membershipId) {
            const membership = await Membership.findById(membershipId);
            if (membership) {
              console.log('verifySession: Found membership:', membership._id.toString());
              
              payment = new Payment({
                userId,
                membershipId,
                amount: membership.price,
                type: 'Membership',
                status: session.payment_status === 'paid' ? 'Completed' : 'Pending',
                stripeSessionId: session_id,
                transactionId: session.payment_intent,
                planType: membership.planType || planType,
                paymentDate: new Date()
              });
              
              await payment.save();
              console.log('verifySession: Created new membership payment during verification:', payment._id.toString());
            } else {
              console.error('verifySession: Membership not found:', membershipId);
            }
          } 
          // Handle SPA booking payment
          else if (bookingId) {
            // Import the SpaBooking model dynamically to avoid circular dependencies
            const { SpaBooking } = require('../models/Spa');
            const booking = await SpaBooking.findById(bookingId);
            
            if (booking) {
              console.log('verifySession: Found SPA booking:', booking._id.toString());
              
              payment = new Payment({
                userId,
                bookingId,
                amount: booking.price,
                type: 'SpaService',
                status: session.payment_status === 'paid' ? 'Completed' : 'Pending',
                stripeSessionId: session_id,
                transactionId: session.payment_intent,
                description: `SPA Service Booking`,
                paymentDate: new Date()
              });
              
              await payment.save();
              console.log('verifySession: Created new SPA payment during verification:', payment._id.toString());
              
              // Update the booking with the payment ID
              booking.paymentId = payment._id;
              await booking.save();
            } else {
              console.error('verifySession: SPA booking not found:', bookingId);
            }
          } else {
            console.error('verifySession: Missing membershipId or bookingId in session metadata');
          }
        } catch (createError) {
          console.error('verifySession: Error creating payment during verification:', createError);
        }
      } else {
        console.error('verifySession: Missing userId in session metadata');
      }
    }
    
    // If we still don't have a payment, return a more helpful response
    if (!payment) {
      console.error('verifySession: Payment not found and could not be created');
      return res.status(404).json({ 
        message: 'Payment not found and could not be created',
        sessionId: session_id,
        userId: userId || 'not provided',
        membershipId: membershipId || 'not provided',
        bookingId: bookingId || 'not provided',
        sessionStatus: session.payment_status
      });
    }
    
    // Get the membership if it exists
    let membership = null;
    if (payment.membershipId) {
      try {
        membership = await Membership.findById(payment.membershipId);
        if (membership) {
          console.log('verifySession: Found membership for payment:', membership._id.toString());
        } else {
          console.error('verifySession: Membership not found for payment:', payment.membershipId);
        }
      } catch (membershipError) {
        console.error('verifySession: Error finding membership:', membershipError);
      }
    }
    
    // Get the SPA booking if it exists
    let spaBooking = null;
    if (payment.bookingId) {
      try {
        // Import the SpaBooking model dynamically to avoid circular dependencies
        const { SpaBooking } = require('../models/Spa');
        spaBooking = await SpaBooking.findById(payment.bookingId);
        if (spaBooking) {
          console.log('verifySession: Found SPA booking for payment:', spaBooking._id.toString());
        } else {
          console.error('verifySession: SPA booking not found for payment:', payment.bookingId);
        }
      } catch (bookingError) {
        console.error('verifySession: Error finding SPA booking:', bookingError);
      }
    }
    
    // Check if payment is already completed
    if (payment.status === 'Completed') {
      console.log('verifySession: Payment already completed:', payment._id.toString());
      return res.status(200).json({ 
        message: 'Payment already completed', 
        payment,
        membership,
        spaBooking,
        alreadyProcessed: true,
        sessionStatus: session.payment_status
      });
    }

    // Update payment status based on Stripe session status
    if (session.payment_status === 'paid') {
      payment.status = 'Completed';
      payment.transactionId = session.payment_intent;
      
      try {
        await payment.save();
        console.log('verifySession: Payment marked as completed:', payment._id.toString());
        
        // Update user membership if this is a membership payment
        if (payment.type === 'Membership' && payment.userId && payment.membershipId) {
          try {
            const updatedMembership = await updateUserMembership(payment.userId, payment.membershipId);
            console.log('verifySession: User membership updated successfully:', updatedMembership._id.toString());
            
            // Update the membership variable for the response
            membership = updatedMembership;
          } catch (membershipUpdateError) {
            console.error('verifySession: Error updating user membership:', membershipUpdateError);
          }
        }
        
        // Update SPA booking status if this is a SPA payment
        if (payment.type === 'SpaService' && payment.bookingId && spaBooking) {
          try {
            // Only update if the booking is in Pending status
            if (spaBooking.status === 'Pending') {
              // Import the SpaBooking model dynamically to avoid circular dependencies
              const { SpaBooking } = require('../models/Spa');
              
              // Update the booking status to Confirmed (no admin approval needed)
              spaBooking.status = 'Confirmed';
              spaBooking.paymentId = payment._id;
              await spaBooking.save();
              
              console.log('verifySession: SPA booking automatically confirmed after payment:', spaBooking._id.toString());
              
              // Send notification to admin about the new confirmed booking
              try {
                const Notification = require('../models/Notification');
                const adminUsers = await User.find({ role: 'admin' });
                
                if (adminUsers && adminUsers.length > 0) {
                  // Create notifications for all admin users
                  const notifications = adminUsers.map(admin => ({
                    recipientId: admin._id,
                    type: 'SpaBookingConfirmed',
                    title: 'New SPA Booking Confirmed',
                    message: `A new SPA booking has been confirmed with payment ID: ${payment._id}`,
                    relatedId: spaBooking._id,
                    isRead: false
                  }));
                  
                  await Notification.insertMany(notifications);
                  console.log('verifySession: Notifications sent to admins about confirmed SPA booking');
                }
              } catch (notificationError) {
                console.error('verifySession: Error sending notifications to admins:', notificationError);
                // Continue execution even if notification fails
              }
            }
          } catch (bookingUpdateError) {
            console.error('verifySession: Error updating SPA booking:', bookingUpdateError);
          }
        }
      } catch (saveError) {
        console.error('verifySession: Error saving payment:', saveError);
        return res.status(500).json({ message: 'Error updating payment status' });
      }
    } else {
      console.log('verifySession: Payment not marked as paid in Stripe:', session.payment_status);
    }
    
    console.log('verifySession: Sending successful response');
    return res.status(200).json({ 
      message: 'Payment verified successfully', 
      payment,
      membership,
      spaBooking,
      sessionStatus: session.payment_status
    });
  } catch (error) {
    console.error('verifySession: Error in verifySession:', error);
    return res.status(500).json({ message: 'Server error during payment verification', error: error.message });
  }
};

// Get payments for a specific user
const getUserPayments = async (req, res) => {
  const { userId } = req.params;
  
  try {
    const payments = await Payment.find({ userId })
      .sort({ createdAt: -1 })
      .populate('membershipId', 'name description');
    
    // Always return an array of payments, even if empty
    res.status(200).json({ 
      message: payments.length ? 'User payment records retrieved successfully' : 'No payment records found',
      payments: payments || []
    });
  } catch (error) {
    console.error('Error retrieving user payments:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve payment records',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      payments: []
    });
  }
};

// Get payments for a specific trainer
const getTrainerPayments = async (req, res) => {
  const { trainerId } = req.params;
  
  try {
    const payments = await Payment.find({ trainerId })
      .sort({ createdAt: -1 });
    
    if (!payments.length) {
      return res.status(200).json({ message: 'No payment records found', payments: [] });
    }
    
    res.status(200).json({ 
      message: 'Trainer payment records retrieved successfully',
      payments
    });
  } catch (error) {
    console.error('Error retrieving trainer payments:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve payment records',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all payments (admin only)
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find({})
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .populate('membershipId', 'name description');
    
    res.status(200).json({ 
      message: 'All payment records retrieved successfully',
      payments
    });
  } catch (error) {
    console.error('Error retrieving all payments:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve payment records',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update payment status
const updatePaymentStatus = async (req, res) => {
  const { paymentId } = req.params;
  const { status } = req.body;
  
  try {
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      { status },
      { new: true }
    );
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }
    
    res.status(200).json({ 
      message: 'Payment status updated successfully',
      payment
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ 
      message: 'Failed to update payment status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Handle Stripe webhook events
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured');
      return res.status(500).json({ message: 'Webhook secret not configured' });
    }
    
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    console.log('Received webhook event:', event.type);
    
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Checkout session completed:', session.id);
        
        // Extract metadata
        const { userId, membershipId, planType, paymentId, bookingId, type } = session.metadata || {};
        
        console.log('Webhook metadata - userId:', userId, 'membershipId:', membershipId, 'paymentId:', paymentId, 'bookingId:', bookingId, 'type:', type);
        
        try {
          // Update or create payment
          let payment;
          
          // First try to find by paymentId if provided
          if (paymentId) {
            payment = await Payment.findById(paymentId);
            if (payment) {
              console.log('Found payment by ID:', payment);
            }
          }
          
          // If not found by ID, try to find by stripeSessionId
          if (!payment) {
            payment = await Payment.findOne({ stripeSessionId: session.id });
            if (payment) {
              console.log('Found payment by stripeSessionId:', payment);
            }
          }
          
          if (!payment) {
            console.log('No payment found, creating a new one');
            
            // Handle based on payment type
            if (type === 'SpaService' && bookingId) {
              // Import the SpaBooking model dynamically to avoid circular dependencies
              const { SpaBooking } = require('../models/Spa');
              const booking = await SpaBooking.findById(bookingId);
              
              if (booking) {
                console.log('Found SPA booking for webhook payment:', booking);
                
                // Create new payment for SPA service
                payment = new Payment({
                  userId,
                  bookingId,
                  amount: booking.price || 50, // Default to 50 if price not set
                  type: 'SpaService',
                  status: 'Completed',
                  stripeSessionId: session.id,
                  transactionId: session.payment_intent,
                  description: 'SPA Service Booking',
                  paymentDate: new Date()
                });
                
                await payment.save();
                console.log('Created new SPA payment via webhook:', payment);
                
                // Update the booking status to Confirmed
                booking.status = 'Confirmed';
                booking.paymentId = payment._id;
                await booking.save();
                console.log('SPA booking automatically confirmed via webhook:', booking._id.toString());
                
                // Send notification to admin about the new confirmed booking
                try {
                  const Notification = require('../models/Notification');
                  const adminUsers = await User.find({ role: 'admin' });
                  
                  if (adminUsers && adminUsers.length > 0) {
                    // Create notifications for all admin users
                    const notifications = adminUsers.map(admin => ({
                      recipientId: admin._id,
                      type: 'SpaBookingConfirmed',
                      title: 'New SPA Booking Confirmed',
                      message: `A new SPA booking has been confirmed with payment ID: ${payment._id}`,
                      relatedId: booking._id,
                      isRead: false
                    }));
                    
                    await Notification.insertMany(notifications);
                    console.log('Webhook: Notifications sent to admins about confirmed SPA booking');
                  }
                } catch (notificationError) {
                  console.error('Webhook: Error sending notifications to admins:', notificationError);
                  // Continue execution even if notification fails
                }
              } else {
                console.error('SPA booking not found for webhook payment:', bookingId);
              }
            } else if (type === 'Membership' || membershipId) {
              // Get membership details if membershipId is provided
              let membershipDetails = null;
              if (membershipId) {
                const membership = await Membership.findById(membershipId);
                if (membership) {
                  membershipDetails = membership;
                } else {
                  console.error('Membership not found:', membershipId);
                }
              }
              
              // Create new payment for membership
              payment = new Payment({
                userId,
                membershipId,
                amount: membershipDetails?.price || 0,
                type: 'Membership',
                status: 'Completed',
                stripeSessionId: session.id,
                transactionId: session.payment_intent,
                planType: membershipDetails?.planType || planType,
                paymentDate: new Date()
              });
              
              await payment.save();
              console.log('Created new membership payment via webhook:', payment);
              
              // Handle membership activation
              if (membershipId) {
                // First, set all existing active memberships for this user to expired
                await Membership.updateMany(
                  { userId, status: 'Active' },
                  { status: 'Expired' }
                );
                console.log('Set all existing active memberships to expired via webhook');
                
                // Then activate the new membership
                const updatedMembership = await Membership.findByIdAndUpdate(
                  membershipId,
                  { 
                    status: 'Active',
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
                  },
                  { new: true, runValidators: true }
                );
                
                if (!updatedMembership) {
                  console.error('Failed to update membership via webhook');
                } else {
                  console.log('Activated membership via webhook:', updatedMembership);
                }
              }
            } else {
              console.error('Webhook: Unknown payment type or missing required IDs');
            }
          } else {
            // Update existing payment
            payment.status = 'Completed';
            payment.transactionId = session.payment_intent;
            payment.paymentDate = new Date();
            await payment.save();
            console.log('Updated payment via webhook:', payment);
            
            // Handle SPA booking if this is a SPA payment
            if (payment.type === 'SpaService' && payment.bookingId) {
              const { SpaBooking } = require('../models/Spa');
              const booking = await SpaBooking.findById(payment.bookingId);
              
              if (booking && booking.status === 'Pending') {
                booking.status = 'Confirmed';
                await booking.save();
                console.log('SPA booking automatically confirmed via webhook:', booking._id.toString());
                
                // Send notification to admin
                try {
                  const Notification = require('../models/Notification');
                  const adminUsers = await User.find({ role: 'admin' });
                  
                  if (adminUsers && adminUsers.length > 0) {
                    const notifications = adminUsers.map(admin => ({
                      recipientId: admin._id,
                      type: 'SpaBookingConfirmed',
                      title: 'New SPA Booking Confirmed',
                      message: `A new SPA booking has been confirmed with payment ID: ${payment._id}`,
                      relatedId: booking._id,
                      isRead: false
                    }));
                    
                    await Notification.insertMany(notifications);
                    console.log('Webhook: Notifications sent to admins about confirmed SPA booking');
                  }
                } catch (notificationError) {
                  console.error('Webhook: Error sending notifications to admins:', notificationError);
                }
              }
            } else if (payment.type === 'Membership' && payment.membershipId) {
              // Handle membership activation
              // First, set all existing active memberships for this user to expired
              await Membership.updateMany(
                { userId: payment.userId, status: 'Active', _id: { $ne: payment.membershipId } },
                { status: 'Expired' }
              );
              console.log('Set all existing active memberships to expired via webhook');
              
              // Then activate the new membership
              const updatedMembership = await Membership.findByIdAndUpdate(
                payment.membershipId,
                { 
                  status: 'Active',
                  startDate: new Date(),
                  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
                },
                { new: true, runValidators: true }
              );
              
              if (!updatedMembership) {
                console.error('Failed to update membership via webhook');
              } else {
                console.log('Activated membership via webhook:', updatedMembership);
              }
            }
          }
        } catch (error) {
          console.error('Error processing webhook payment:', error);
        }
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
};

const createPendingPayment = async (req, res) => {
  try {
    const { amount, type, membershipId, userId, planType, bookingId, description } = req.body;

    console.log('Creating pending payment with data:', req.body);
    
    // Validate required fields
    if (!type || !userId) {
      console.error('Missing required payment fields:', { type, userId });
      return res.status(400).json({ message: 'Missing required payment information' });
    }

    // Set default amount for SPA services if missing or invalid
    let paymentAmount = amount;
    if (type === 'SpaService' && (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0)) {
      console.log('Using default amount (499) for SPA service payment');
      paymentAmount = 499;
    } else if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) {
      console.error('Invalid amount value:', amount);
      return res.status(400).json({ message: 'Invalid amount value' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found with ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Check for SPA booking if type is SpaService and bookingId is provided
    if (type === 'SpaService' && bookingId) {
      // Import the SpaBooking model dynamically to avoid circular dependencies
      const { SpaBooking } = require('../models/Spa');
      const spaBooking = await SpaBooking.findById(bookingId);
      if (!spaBooking) {
        console.error(`SPA booking with ID ${bookingId} not found`);
        return res.status(404).json({ message: 'SPA booking not found' });
      } else {
        console.log('Found SPA booking for pending payment:', spaBooking);
      }
    }

    // Generate a unique temporary ID for stripeSessionId to avoid null value issues
    const tempSessionId = 'pending-' + crypto.randomBytes(16).toString('hex');
    console.log('Generated temporary session ID:', tempSessionId);

    // Create a new payment record
    const payment = new Payment({
      userId,
      amount: paymentAmount,
      type,
      status: 'Pending',
      membershipId: type === 'Membership' ? membershipId : null,
      bookingId: type === 'SpaService' ? bookingId : null,
      planType: planType || null,
      description: description || null,
      stripeSessionId: tempSessionId // Set a unique temporary ID
    });

    await payment.save();
    console.log('Created pending payment record:', payment);
    
    // Return the payment record
    return res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating pending payment:', error);
    return res.status(500).json({ 
      message: 'Server error creating pending payment', 
      error: error.message 
    });
  }
};

// Export functions
module.exports = {
  createPayment,
  createPendingPayment,
  sendPaymentOTP,
  verifyPaymentOTP,
  verifySession,
  getUserPayments,
  getTrainerPayments,
  getAllPayments,
  updatePaymentStatus,
  handleStripeWebhook
};

