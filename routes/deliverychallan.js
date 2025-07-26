const mongoose = require('mongoose');

const deliveryChallanSchema = new mongoose.Schema({
 
  transportnumber: {
    type: Date,
  },
  transport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'transport',
  },
  transportDate: {
    type: Date,
  },
  deliveryPerson: {
    type: String,
  },
  deliveryContact: {
    type: String,
  },
  moneyToBeReceived: {
    type: Number,
  },
  notes: {
    type: String,
  },
});

const DeliveryChallan = mongoose.model('DeliveryChallan', deliveryChallanSchema);

module.exports = DeliveryChallan;