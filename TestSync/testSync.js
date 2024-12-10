import mongoose from "mongoose";
import cron from "node-cron";
import nodemailer from "nodemailer";
import { syncDailyBalanceWithOpeningBalance } from "../controllers/financeController.js";

// Function to connect to MongoDB
const connectToDB = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(
      "mongodb+srv://parthsankpal47:pRRgKTuVsIDVIobs@cluster0.lp4r5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
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
      user: "your-email@gmail.com", // Your email
      pass: "your-email-password-or-app-password", // App password
    },
  });

  const mailOptions = {
    from: "your-email@gmail.com",
    to: "your-notification-email@gmail.com", // Recipient email
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
  "28 18 * * *", // Cron job for 11:58 PM IST (18:28 UTC)
  async () => {
    console.log("Running scheduled task at 11:58 PM IST...");

    try {
      await connectToDB(); // Ensure MongoDB is connected
      await syncDailyBalanceWithOpeningBalance(); // Run your function

      console.log("syncDailyBalanceWithOpeningBalance executed successfully.");
      await sendNotification(
        "Cron job executed successfully at 11:58 PM IST."
      ); // Send success notification
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
