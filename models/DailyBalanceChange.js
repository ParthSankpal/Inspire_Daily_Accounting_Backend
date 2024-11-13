// models/DailyBalanceChange.js
import mongoose from 'mongoose';

const dailyBalanceChangeSchema = new mongoose.Schema({
  date: { type: String, required: true }, // Format 'YYYY-MM-DD'
  cash: { type: Number, default: 0 },
  accounts: {
    central_bank: { type: Number, default: 0 },
    union_bank: { type: Number, default: 0 },
    tjsb_bank: { type: Number, default: 0 },
  },
});

export default mongoose.model('DailyBalanceChange', dailyBalanceChangeSchema);
