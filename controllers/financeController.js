import Transaction from '../models/Transaction.js';
import OpeningBalance from '../models/OpeningBalance.js';
import DailyBalanceChange from '../models/DailyBalanceChange.js';


// Helper function to update opening balance
const updatedailyOpeningBalance = async (transaction) => { 
  const { amount, type, mode, bankName } = transaction;
  
  // Get today's date in 'YYYY-MM-DD' format
  const today = new Date().toISOString().split('T')[0];

  // Find or initialize today's opening balance
  let openingBalance = await DailyBalanceChange.findOne({ date: today });

  if (!openingBalance) {
    // If no opening balance exists for today, create one
    openingBalance = new DailyBalanceChange({
      date: today,
      cash: 0,
      accounts: {
        central_bank: 0,
        union_bank: 0,
        tjsb_bank: 0,
      },
    });
  }

  // Update the opening balance based on transaction type and mode
  if (type === 'income') {
    if (mode === 'cash') {
      openingBalance.cash += amount;
    } else if (mode === 'cheque' || mode === 'online_upi') {
      openingBalance.accounts[bankName] += amount;
    }
  } else if (type === 'expense') {
    if (mode === 'cash') {
      openingBalance.cash -= amount;
    } else if (mode === 'cheque' || mode === 'online_upi') {
      openingBalance.accounts[bankName] -= amount;
    }
  }

  // Save the updated opening balance
  await openingBalance.save();
};



export const addTransaction = async (req, res) => {
  try {
    const { description, amount, type, category, paid_to, payee, date, bankAccount, bankName, mode } = req.body;

    const lastTransaction = await Transaction.findOne().sort({ date: -1 });
    const previousBalance = lastTransaction ? lastTransaction.balanceAfterTransaction : 0;
    const balanceAfterTransaction = type === 'income' 
      ? previousBalance + amount 
      : previousBalance - amount;

    const transaction = new Transaction({
      description,
      amount,
      type,
      category,
      paid_to: type === 'expense' ? paid_to : undefined,
      payee: type === 'income' ? payee : undefined,
      date,
      bankAccount,
      bankName,
      mode,
      balanceAfterTransaction,
    });

    await transaction.save();

    // Update daily balance changes
    await updatedailyOpeningBalance(transaction);

    res.status(201).json(transaction);
    
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

export const setOpeningBalance = async (req, res) => {
  try {
    const { date, amount } = req.body;
    const openingBalance = await OpeningBalance.findOneAndUpdate(
      { date },
      { amount },
      { upsert: true, new: true }
    );

    res.json(openingBalance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 


// Get opening balance for a specific date
export const getOpeningBalanceByDate = async (req, res) => {
  try {
      const { date } = req.params;
      // console.log(date);

      // Set start and end of the day for the given date
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const openingBalance = await OpeningBalance.findOne({
          date: { $gte: startOfDay, $lte: endOfDay }
      });

      if (!openingBalance) {
          return res.status(404).json({ message: 'No opening balance found for this date' });
      }

      res.json(openingBalance);
  } catch (error) {
      res.status(500).json({ message: 'Error fetching opening balance', error });
  }
};



export const syncDailyBalanceWithOpeningBalance = async () => {
  const today = new Date().toISOString().split('T')[0];

  // Get today's daily balance change
  const dailyChange = await DailyBalanceChange.findOne({ date: today });

  if (dailyChange) {
    // Find or initialize today's opening balance
    let openingBalance = await OpeningBalance.findOne({ date: today });

    if (!openingBalance) {
      openingBalance = new OpeningBalance({
        date: today,
        cash: 0,
        accounts: {
          central_bank: 0,
          union_bank: 0,
          tjsb_bank: 0,
        },
      });
    }

    // Update opening balance based on daily changes
    openingBalance.cash += dailyChange.cash;
    openingBalance.accounts.central_bank += dailyChange.accounts.central_bank;
    openingBalance.accounts.union_bank += dailyChange.accounts.union_bank;
    openingBalance.accounts.tjsb_bank += dailyChange.accounts.tjsb_bank;

    // Save the updated opening balance
    await openingBalance.save();

    // Optionally delete the daily change record after syncing
    await DailyBalanceChange.deleteOne({ date: today });
  }
};



// Get today's transactions with daily balance changes
export const getTodayTransactionsWithBalance = async (req, res) => {
  try {
    // Get today's date in 'YYYY-MM-DD' format
    const today = new Date().toISOString().split('T')[0];
    
    // Set start and end of the day
    const startOfDay = new Date(today);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Fetch all transactions for today
    const transactions = await Transaction.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ date: 1 }); // Sort by time for ordered transactions

    // Fetch today's daily balance change
    const dailyBalanceChange = await DailyBalanceChange.findOne({ date: today });

    // If no transactions or daily balance change found, return an appropriate response
    if (!transactions.length && !dailyBalanceChange) {
      return res.status(404).json({ message: 'No transactions or balance changes found for today' });
    }

    // Send response with today's transactions and daily balance change
    res.json({
      date: today,
      transactions,
      dailyBalanceChange: dailyBalanceChange || {
        date: today,
        cash: 0,
        accounts: {
          central_bank: 0,
          union_bank: 0,
          tjsb_bank: 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching today’s transactions and balance changes', error });
  }
};