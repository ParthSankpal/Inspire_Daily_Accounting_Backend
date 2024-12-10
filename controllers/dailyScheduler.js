import mongoose from "mongoose";
import cron from "node-cron";
import nodemailer from "nodemailer";
import { syncDailyBalanceWithOpeningBalance } from "../controllers/financeController.js";
import dotenv from 'dotenv';

dotenv.config();

// Function to connect to MongoDB
const connectToDB = async () => {
  try {
    console.log("Connecting  to MongoDB...");
    await mongoose.connect(
      process.env.MONGO_DATABASE,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("MongoDB connected successfully.");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
};

// Function to send email notifications
const sendNotification = async (message) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "parth.s4878@gmail.com", 
      pass: process.env.EMAIL_APP_PASSWORD, 
    },
  });

  const mailOptions = {
    from: "parth.s4878@gmail.com",
    to: "parth.sankpal47@gmail.com", 
    subject: "Cron Job Execution Notification",
    text: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Notification email sent successfully.");
  } catch (error) {
    console.error("Error sending notification email:", error);
  }
};

// Schedule the cron job
cron.schedule(
  "41 21 * * *", // Cron job for 11:58 PM IST (18:28 UTC)
  async () => {
    console.log("Running scheduled task at 21:22 PM IST...");

    try {
      await connectToDB(); // Ensure MongoDB is connected
      const { message, updatedBalance } = await syncDailyBalanceWithOpeningBalance(); // Run your function

      const notificationMessage = `${message}\n\nUpdated Opening Balance:\n- Cash: ₹${updatedBalance.cash}\n- Central Bank: ₹${updatedBalance.accounts.central_bank}\n- Union Bank: ₹${updatedBalance.accounts.union_bank}\n- TJSB Bank: ₹${updatedBalance.accounts.tjsb_bank}`;

      console.log("syncDailyBalanceWithOpeningBalance executed successfully.");
      await sendNotification(notificationMessage);
    } catch (error) {
      console.error("Error executing syncDailyBalanceWithOpeningBalance:", error);
      await sendNotification(
        `Cron job failed with error: ${error.message}`
      ); // Send failure notification
    } finally {
      mongoose.connection.close(); // Close MongoDB connection
      console.log("MongoDB connection closed.");
    }
  },
  {
    timezone: "Asia/Kolkata", // Set the timezone to IST
  }
);

console.log("Cron job scheduled for 11:58 PM IST.");
