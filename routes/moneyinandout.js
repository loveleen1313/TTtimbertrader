const mongoose = require('mongoose');

const moneyinandoutSchema = new mongoose.Schema({
  inandout: {
    type: Number,
    
  },
  amount: {
    type: Number,
    
  },
  Dateandtimeinandout: {
    type: Date,  
  },
  comment: {
    type: String, 
  },
  modeofpayment : {
    type: String, 
  },
  receipt : {
    type : mongoose.Schema.Types.ObjectId,
    ref: 'ttreceipt',
  },
});

const moneyinandout = mongoose.model('moneyinandout', moneyinandoutSchema);

module.exports = moneyinandout;
