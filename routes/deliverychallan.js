const mongoose = require('mongoose');

const deliveryChallanSchema = new mongoose.Schema({
  challanDate: {
    type: Date,
    default: Date.now
  },
  challanNumber: {
    type: String,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
  },
  clientSite: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clientsite',
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
  itemsDelivered: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'scaffoldingout',
  }],
  nutbolt: {
    type: Number,
  },
  key: {
    type: Number,
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