// API Root Endpoint

module.exports = (req, res) => {
  // Log request details
  console.log('API root request received:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    query: req.query
  });

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
    return res.status(200).end();
  }

  // Return API info
  return res.status(200).json({
    message: 'TrackFit API is running',
    version: '1.0.0',
    endpoints: [
      { path: '/api/health', methods: ['GET'] },
      { path: '/api/users/login', methods: ['POST'] },
      { path: '/api/users/register', methods: ['POST'] }
    ]
  });
}; 