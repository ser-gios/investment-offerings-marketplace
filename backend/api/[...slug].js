/**
 * Vercel catch-all serverless function with CORS (CommonJS)
 */

require('dotenv').config();
const app = require('../api/index');

module.exports = function handler(req, res) {
  // Set CORS headers BEFORE anything else
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Forward to Express app
  return app(req, res);
};
