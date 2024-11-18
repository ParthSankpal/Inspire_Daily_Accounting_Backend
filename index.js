import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import auth from './routes/auth.route.js';
import finance from './routes/finance.routes.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';

dotenv.config();

// MongoDB connection setup
mongoose.connect(process.env.MONGO_DATABASE)
  .then(() => {
    console.log('CONNECTED TO MONGODB');
  })
  .catch((err) => {
    console.log('MongoDB Connection Error:', err.message);
  });

const app = express();

// Middleware setup
app.use(express.json());
app.use(cookieParser());
app.use(cors()); // Allow all origins

// Utility function to get MongoDB connection status
const getMongoDBStatus = () => {
  const statuses = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
  };
  return statuses[mongoose.connection.readyState] || 'Unknown';
};

// // Middleware to log requests
// app.use((req, res, next) => {
//   console.log(`Incoming Request: ${req.method} ${req.url}`);
//   if (Object.keys(req.body).length) {
//     console.log('Request Body:', JSON.stringify(req.body, null, 2));
//   }
//   next();
// });

// Root endpoint
app.get('/', (req, res) => {
  const mongodbStatus = getMongoDBStatus();
  console.log('MongoDB Status:', mongodbStatus);

  res.status(200).json({
    message: 'Backend is working correctly!',
    status: 'success',
    mongodbStatus,
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/auth', auth);
app.use('/api/finance', finance);

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode || 500;
  const message = err.message || 'INTERNAL SERVER ERROR';
  console.error('Error:', {
    statusCode,
    message,
    stack: err.stack || 'No stack trace available',
  });

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    error: err.stack || 'No stack trace available',
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SERVER STARTED ON PORT ${PORT}`);
});
