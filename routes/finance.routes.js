import express from 'express';
import {
  getOpeningBalanceByDate,
  addTransaction,
  setOpeningBalance,
  getTodayTransactionsWithBalance,
  getTransactionsbyID,
  editTransactionsByID,
  getTransactionsByDate,
} from '../controllers/financeController.js';

const router = express.Router();

router.get('/openingBalance/:date', getOpeningBalanceByDate);
router.get('/todayTransactions/:date', getTodayTransactionsWithBalance);
router.post('/transactions', addTransaction);
router.post('/opening-balance', setOpeningBalance);
router.get('/getTransactionsbyID/:id', getTransactionsbyID);
router.put('/editTransaction/:id', editTransactionsByID);
router.get('/getTransactionsByDate/:date', getTransactionsByDate);



export default router;
