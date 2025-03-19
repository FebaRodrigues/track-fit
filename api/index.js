// Main API entry point for Vercel
const fs = require('fs');
const path = require('path');
const url = require('url');

/**
 * Helper to dynamically import a module
 * @param {string} modulePath - Path to the module to import
 */
const requireDynamically = (modulePath) => {
  try {
    return require(modulePath);
  } catch (err) {
    console.error(`Failed to import module ${modulePath}:`, err);
    return null;
  }
};

/**
 * Main handler for API requests
 */
module.exports = async (req, res) => {
  // Set common CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse the URL to determine which handler to use
  const parsedUrl = url.parse(req.url, true);
  const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
  
  console.log('=== API Request Info ===');
  console.log('URL:', req.url);
  console.log('Method:', req.method);
  console.log('Path segments:', pathSegments);
  console.log('=====================');

  // Special handling for root path
  if (pathSegments.length === 0) {
    return res.status(200).json({
      status: 'ok',
      message: 'API is running',
      endpoints: [
        '/api/health',
        '/api/debug',
        '/api/users/login',
        '/api/users/register',
        '/api/trainers/login',
        '/api/trainers/register',
        '/api/admin/login'
      ]
    });
  }

  // Special case for health endpoint
  if (pathSegments[0] === 'health') {
    return res.status(200).json({
      status: 'ok',
      message: 'API is healthy',
      timestamp: new Date().toISOString()
    });
  }

  // Special case for debug endpoint
  if (pathSegments[0] === 'debug') {
    const debugHandler = requireDynamically('./debug');
    if (debugHandler) {
      return debugHandler(req, res);
    }
    
    // Fallback if debug handler not found
    return res.status(200).json({
      message: 'Debug information',
      path: req.url,
      method: req.method,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });
  }

  // Determine the handler path based on URL segments
  let handlerPath;
  
  if (pathSegments.length >= 2) {
    // For paths like /users/login or /trainers/register
    handlerPath = `./${pathSegments.join('/')}`;
  } else if (pathSegments.length === 1) {
    // For top-level paths like /health
    handlerPath = `./${pathSegments[0]}`;
  } else {
    return res.status(404).json({ error: 'Endpoint not found' });
  }

  // Try to import the handler
  try {
    // Check if the JS file exists
    const jsHandlerPath = `${handlerPath}.js`;
    const fullPath = path.resolve(__dirname, jsHandlerPath);
    
    console.log('Looking for handler at:', fullPath);
    
    if (fs.existsSync(fullPath)) {
      console.log('Handler found, importing...');
      const handler = requireDynamically(jsHandlerPath);
      
      if (handler) {
        // Call the handler with the request and response
        console.log('Calling handler for', pathSegments.join('/'));
        return handler(req, res);
      } else {
        console.error('Handler import failed for', jsHandlerPath);
      }
    } else {
      console.log('Handler file not found at', fullPath);
    }

    // If we reach here, no handler was found or it failed to load
    return res.status(404).json({
      error: 'Endpoint not implemented',
      path: parsedUrl.pathname
    });
  } catch (error) {
    console.error('Error in API router:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
}; 