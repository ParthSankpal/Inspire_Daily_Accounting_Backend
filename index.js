import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import auth from './routes/auth.route.js';
import finance from './routes/finance.routes.js';

dotenv.config();

import cookieParser from 'cookie-parser';

// Connect to MongoDB
mongoose.connect(process.env.MONGO_DATABASE)
  .then(() => {
    console.log('CONNECTED TO MONGODB');
  })
  .catch((err) => {
    console.log(err.message);
  });

const app = express();

// Middleware setup
app.use(express.json());
app.use(cookieParser());

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Backend is working correctly!',
    status: 'success',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/auth', auth);
app.use('/api/finance', finance);

// Error handling middleware (for any unhandled errors)
app.use((err, req, res, next) => {
  const statusCode = res.statusCode || 500;
  const message = err.message || 'INTERNAL SERVER ERROR';

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

// Start the server
app.listen(3000, () => {
  console.log('SERVER STARTED ON PORT 3000');
});
