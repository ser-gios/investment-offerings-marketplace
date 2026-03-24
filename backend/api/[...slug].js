/**
 * Vercel catch-all serverless function with CORS
 */

require('dotenv').config();
const app = require('../index');

export default function handler(req, res) {
  // Set CORS headers BEFORE anything else
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Forward to Express app
  return app(req, res);
}
