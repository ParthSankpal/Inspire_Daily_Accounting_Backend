import Transaction from '../models/Transaction.js';
import OpeningBalance from '../models/OpeningBalance.js';
import DailyBalanceChange from '../models/DailyBalanceChange.js';


export const addTransaction = async (req, res) => {
  try {
    const { description, amount, type, category, paid_to, payee, date, bankAccount, bankName, mode } = req.body;

    // Create a new transaction
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
    });

    // Save the transaction
    await transaction.save();

    // Update daily balance
    await updateDailyBalanceForCreate(transaction);

    res.status(201).json(transaction);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// New function to handle the creation of a transaction
const updateDailyBalanceForCreate = async (transaction) => {
  const { amount, type, mode, bankName } = transaction;

  const today = new Date().toISOString().split('T')[0];

  // Find or initialize today's opening balance
  let openingBalance = await DailyBalanceChange.findOne({ date: today });

  if (!openingBalance) {
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

  // Apply the new transaction's effects
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
      date: date
    });

    if (!openingBalance) {
      // console.log("No Opening Balance");

      return res.status(201).json({ message: 'No opening balance found for this date' });
    }

    res.json(openingBalance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching opening balance', error });
  }
};



// export const syncDailyBalanceWithOpeningBalance = async () => {
//   const today = new Date().toISOString().split('T')[0];
//   console.log(today);

//   // Get today's daily balance change
//   const dailyChange = await DailyBalanceChange.find({ date: today });
//   console.log(dailyChange);
  
//   let openingBalance = await OpeningBalance.findOne({
//     date: today // Corrected 'date' variable to 'today'
//   });

//   // Commented out the if-checks
//   // if (dailyChange) {
//     // Find or initialize today's opening balance

//     // if (!openingBalance) {
//     openingBalance = new OpeningBalance({
//       date: today,
//       cash: 0,
//       accounts: {
//         central_bank: 0,
//         union_bank: 0,
//         tjsb_bank: 0,
//       },
//     });
//   // }

//   // Update opening balance based on daily changes
//   openingBalance.cash += dailyChange.cash;
//   openingBalance.accounts.central_bank += dailyChange.accounts.central_bank;
//   openingBalance.accounts.union_bank += dailyChange.accounts.union_bank;
//   openingBalance.accounts.tjsb_bank += dailyChange.accounts.tjsb_bank;

//   console.log("UPDATED THE OPENING BALANCE");

//   // Save the updated opening balance
//   await openingBalance.save();

//   // Optionally delete the daily change record after syncing
//   // await DailyBalanceChange.deleteOne({ date: today });
//   // }
// };



// Get today's transactions with daily balance changes

// export const syncDailyBalanceWithOpeningBalance = async () => {
//   const today = new Date().toISOString().split('T')[0];
//   console.log(`Today's date: ${today}`);

//   try {
//     console.log("Fetching daily balance changes...");
//     const dailyChange = await DailyBalanceChange.findOne({ date: today });
//     if (!dailyChange) {
//       console.log("No daily changes found for today.");
//       return;
//     }
//     console.log("Daily changes fetched:", dailyChange);

//     console.log("Fetching opening balance...");
//     let openingBalance = await OpeningBalance.findOne({ date: today });
//     if (!openingBalance) {
//       console.log("No opening balance found. Initializing...");
//       openingBalance = new OpeningBalance({
//         date: today,
//         cash: 0,
//         accounts: { central_bank: 0, union_bank: 0, tjsb_bank: 0 },
//       });
//     }

//     // Update opening balance
//     openingBalance.cash += dailyChange.cash;
//     openingBalance.accounts.central_bank += dailyChange.accounts.central_bank;
//     openingBalance.accounts.union_bank += dailyChange.accounts.union_bank;
//     openingBalance.accounts.tjsb_bank += dailyChange.accounts.tjsb_bank;

//     console.log("Updated Opening Balance:", openingBalance);

//     // Save to database
//     await openingBalance.save();
//     console.log("Opening balance saved.");
//   } catch (error) {
//     console.error("Error syncing daily balance with opening balance:", error);
//     throw error;
//   }
// };

export const syncDailyBalanceWithOpeningBalance = async () => {
  const today = new Date();
  const todayDateString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD

  // Calculate tomorrow's date
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowDateString = tomorrow.toISOString().split('T')[0]; // Format: YYYY-MM-DD

  console.log(`Today's date: ${todayDateString}`);
  console.log(`Tomorrow's date: ${tomorrowDateString}`);

  try {
    // Get today's daily balance changes
    const dailyChange = await DailyBalanceChange.findOne({ date: todayDateString });

    if (!dailyChange) {
      console.log("No daily balance changes found for today.");
      return;
    }

    // Find or initialize tomorrow's opening balance
    let openingBalance = await OpeningBalance.findOne({ date: tomorrowDateString });

    if (!openingBalance) {
      console.log("No opening balance found for tomorrow. Creating a new one.");
      openingBalance = new OpeningBalance({
        date: tomorrowDateString,
        cash: 0,
        accounts: {
          central_bank: 0,
          union_bank: 0,
          tjsb_bank: 0,
        },
      });
    }

    // Update tomorrow's opening balance based on today's daily changes
    openingBalance.cash += dailyChange.cash;
    openingBalance.accounts.central_bank += dailyChange.accounts.central_bank;
    openingBalance.accounts.union_bank += dailyChange.accounts.union_bank;
    openingBalance.accounts.tjsb_bank += dailyChange.accounts.tjsb_bank;

    console.log("Updated tomorrow's opening balance:", openingBalance);

    // Save the updated opening balance
    await openingBalance.save();
    console.log("Tomorrow's opening balance has been successfully synced.");
    return openingBalance;
  } catch (error) {
    console.error("Error syncing daily balance with opening balance:", error);
  }
};


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



export const getTransactionsbyID = async (req, res) => {
  try {
    const { id } = req.params;
    // console.log(`Fetching transaction with ID: ${id}`);

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // console.log(transaction);
    res.json(transaction);
  } catch (error) {
    console.error(error);

    if (error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    res.status(500).json({ message: error.message });
  }
};


export const editTransactionsByID = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Updating transaction with ID: ${id}`);

    // Extract fields from request body
    const { description, amount, type, category, paid_to, payee, date, bankAccount, bankName, mode } = req.body;

    // Fetch the existing transaction for balance adjustment
    const existingTransaction = await Transaction.findById(id);
    if (!existingTransaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Calculate the new balance (if necessary)
    const lastTransaction = await Transaction.findOne().sort({ date: -1 });
    const previousBalance = lastTransaction ? lastTransaction.balanceAfterTransaction : 0;
    const balanceAfterTransaction = type === 'income'
      ? previousBalance + amount
      : previousBalance - amount;

    // Update the transaction
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      id,
      {
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
      },
      { new: true } // Return the updated document
    );

    if (!updatedTransaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Update the daily balance changes
    await updateDailyOpeningBalanceOnEdit(existingTransaction, updatedTransaction);

    res.status(200).json(updatedTransaction);
  } catch (error) {
    console.error(error);

    if (error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    res.status(500).json({ message: error.message });
  }
};


const updateDailyOpeningBalanceOnEdit = async (oldTransaction, newTransaction) => {
  console.log("Old Transaction:", oldTransaction);
  console.log("New Transaction:", newTransaction);

  // Destructure old and new transaction details
  const { amount: oldAmount, type: oldType, mode: oldMode, bankName: oldBankName } = oldTransaction || {};
  const { amount: newAmount, type: newType, mode: newMode, bankName: newBankName } = newTransaction;

  // Get today's date (or fallback if not specified)
  const today = new Date().toISOString().split('T')[0];

  // Find or initialize today's opening balance
  let openingBalance = await DailyBalanceChange.findOne({ date: today });

  if (!openingBalance) {
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

  // Reverse the old transaction's effects (if there was an old transaction)
  if (oldTransaction) {
    if (oldType === 'income') {
      if (oldMode === 'cash') {
        openingBalance.cash -= oldAmount;
      } else if (oldMode === 'cheque' || oldMode === 'online_upi') {
        openingBalance.accounts[oldBankName] -= oldAmount;
      }
    } else if (oldType === 'expense') {
      if (oldMode === 'cash') {
        openingBalance.cash += oldAmount;
      } else if (oldMode === 'cheque' || oldMode === 'online_upi') {
        openingBalance.accounts[oldBankName] += oldAmount;
      }
    }
  }

  // Apply the new transaction's effects
  if (newType === 'income') {
    if (newMode === 'cash') {
      openingBalance.cash += newAmount;
    } else if (newMode === 'cheque' || newMode === 'online_upi') {
      openingBalance.accounts[newBankName] += newAmount;
    }
  } else if (newType === 'expense') {
    if (newMode === 'cash') {
      openingBalance.cash -= newAmount;
    } else if (newMode === 'cheque' || newMode === 'online_upi') {
      openingBalance.accounts[newBankName] -= newAmount;
    }
  }

  // Save the updated opening balance
  await openingBalance.save();
};


export const getTransactionsByDate = async (req, res) => {
  try {
    const { date } = req.params;
    console.log(date);

    const parsedDate = new Date(date);

    const transactions = await Transaction.find({
      date: date,
    });

    const dailyBalanceChanges = await DailyBalanceChange.find({
      date: date,
    });

    const openingBalance = await OpeningBalance.findOne({
      date: date,
    });

    // console.log(transactions, dailyBalanceChanges, openingBalance);

    res.json({ date, transactions, dailyBalanceChanges, openingBalance });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch data', error });
  }
};
