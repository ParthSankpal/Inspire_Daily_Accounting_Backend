// import mongoose from 'mongoose';
// import { syncDailyBalanceWithOpeningBalance } from '../controllers/financeController.js';

// (async () => {
//   try {
//     console.log("Connecting to MongoDB...");
//     await mongoose.connect("mongodb+srv://parthsankpal47:pRRgKTuVsIDVIobs@cluster0.lp4r5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });

//     console.log("MongoDB connected successfully.");
//     console.log("Testing daily balance sync...");
//     await syncDailyBalanceWithOpeningBalance();
//     console.log("Test completed successfully.");
//   } catch (error) {
//     console.error("Error during test sync:", error);
//   } finally {
//     mongoose.connection.close();
//     console.log("MongoDB connection closed.");
//   }
// })();



import mongoose from 'mongoose';
import cron from 'node-cron';
import { syncDailyBalanceWithOpeningBalance } from './controllers/financeController.js';

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
  }
};

// Schedule the task to run at 11:58 PM IST every day
cron.schedule(
  "28 18 * * *", // Cron job for 11:58 PM IST (18:28 UTC)
  async () => {
    console.log("Running scheduled task at 11:58 PM IST...");

    await connectToDB(); // Ensure MongoDB is connected

    try {
      await syncDailyBalanceWithOpeningBalance(); // Run your function
      console.log("syncDailyBalanceWithOpeningBalance executed successfully.");
    } catch (error) {
      console.error("Error executing syncDailyBalanceWithOpeningBalance:", error);
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
