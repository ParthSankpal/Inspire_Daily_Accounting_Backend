import cron from 'node-cron';


import { syncDailyBalanceWithOpeningBalance } from './financeController.js'; // Update the path as necessary

// Schedule the function to run at midnight every day
cron.schedule("0 0 * * *", async () => {
  try {
    console.log("Starting daily balance sync...");
    await syncDailyBalanceWithOpeningBalance();
    console.log("Daily balance sync completed successfully.");
  } catch (error) {
    console.error("Error syncing daily balance with opening balance:", error);
  }
});
