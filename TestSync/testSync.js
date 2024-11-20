import mongoose from 'mongoose';
import { syncDailyBalanceWithOpeningBalance } from '../controllers/financeController.js';

(async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect("mongodb+srv://parthsankpal47:pRRgKTuVsIDVIobs@cluster0.lp4r5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("MongoDB connected successfully.");
    console.log("Testing daily balance sync...");
    await syncDailyBalanceWithOpeningBalance();
    console.log("Test completed successfully.");
  } catch (error) {
    console.error("Error during test sync:", error);
  } finally {
    mongoose.connection.close();
    console.log("MongoDB connection closed.");
  }
})();
