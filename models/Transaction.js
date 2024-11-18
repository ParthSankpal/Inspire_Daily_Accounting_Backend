import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  description: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true,
  },
  category: {
    type: String,
    required: true,
    validate: {
      validator: function(value) {
        const incomeCategories = [
          'tuition_fees', 'exam_fees', 'grants', 'donations', 'material_sales', 'consulting_training'
        ];
        const expenseCategories = [
          'salaries', 'rent_utilities', 'supplies_materials', 'marketing', 'scholarships', 'event_expenses'
        ];
        
        return this.type === 'income' 
          ? incomeCategories.includes(value) 
          : expenseCategories.includes(value);
      },
      message: props => `${props.value} is not a valid category for ${props.path}`
    }
  },
  paid_to: {
    type: String,
    required: function() { return this.type === 'expense'; }, 
  },
  payee: {
    type: String,
    required: function() { return this.type === 'income'; },
  },
  balanceAfterTransaction: {
    type: Number,
    required: true,
  },
  bankName: {
    type: String,
    required: true,
    enum: ['central_bank', 'union_bank', 'tjsb_bank'],
  },
  bankAccount: {
    type: String,
    required: true,
    enum: ['CBI123456', 'CBI789012', 'UBI345678','UBI901234', 'TJSB567890','TJSB123456' ],
  },
  mode: {
    type: String,
    required: true,
    enum: ['cash', 'online_upi', 'cheque'],
  },  
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
