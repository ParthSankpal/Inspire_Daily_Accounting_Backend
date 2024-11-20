import mongoose from 'mongoose';

const openingBalanceSchema = new mongoose.Schema({
  date: {
    type: String, // Format 'YYYY-MM-DD'
    required: true,
    unique: true,
  },
  cash: {
    type: Number,
    required: true,
    default: 0,
  },
  accounts: {
    central_bank: { type: Number, default: 0 },
    union_bank: { type: Number, default: 0 },
    tjsb_bank: { type: Number, default: 0 },
  },
});

const OpeningBalance = mongoose.model('OpeningBalance', openingBalanceSchema);

export default OpeningBalance;
