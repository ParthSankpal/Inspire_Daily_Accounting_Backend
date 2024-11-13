import express from 'express';
import {
  getOpeningBalanceByDate,
  addTransaction,
  setOpeningBalance,
  getTodayTransactionsWithBalance,
} from '../controllers/financeController.js';

const router = express.Router();

router.get('/openingBalance/:date', getOpeningBalanceByDate);
router.get('/api/finance/todayTransactions', getTodayTransactionsWithBalance);
router.post('/transactions', addTransaction);
router.post('/opening-balance', setOpeningBalance);

export default router;
