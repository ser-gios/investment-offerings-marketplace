/**
 * Vercel Serverless Function - Main API Entry Point
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// CORS configuration - permissive for development/testing
const corsOptions = {
  origin: ['https://investment-marketplace-frontend.vercel.app', 'http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', require('../routes/auth'));
app.use('/api/projects', require('../routes/projects'));
app.use('/api/investments', require('../routes/investments'));
app.use('/api/ratings', require('../routes/ratings'));
app.use('/api/uploads', require('../routes/uploads'));
app.use('/api/deposits', require('../routes/deposits'));
app.use('/api/admin', require('../routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString(), environment: process.env.NODE_ENV });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    code: err.code
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
