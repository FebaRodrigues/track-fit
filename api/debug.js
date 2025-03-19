// Debug API endpoint
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('Received OPTIONS request for debug endpoint');
    return res.status(200).end();
  }

  try {
    // Get request details
    const requestInfo = {
      timestamp: new Date().toISOString(),
      url: req.url,
      method: req.method,
      headers: req.headers,
      query: req.query || {},
      cookies: req.cookies || {},
      body: req.body || {},
      rawBody: '',
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'not set',
        VERCEL_ENV: process.env.VERCEL_ENV || 'not set',
        VERCEL_URL: process.env.VERCEL_URL || 'not set',
        VERCEL_REGION: process.env.VERCEL_REGION || 'not set'
      }
    };

    // Log the debug info
    console.log('=== DEBUG REQUEST INFO ===');
    console.log(JSON.stringify(requestInfo, null, 2));
    console.log('=========================');

    // Return the debug info
    return res.status(200).json({
      message: 'Debug information',
      requestInfo,
      serverTime: new Date().toISOString(),
      apiStatus: 'operational'
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return res.status(500).json({ 
      message: 'Internal server error in debug endpoint',
      error: error.message
    });
  }
}; 