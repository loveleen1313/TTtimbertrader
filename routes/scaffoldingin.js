
const mongoose = require('mongoose');

const scaffoldinginSchema = new mongoose.Schema({

  Dateandtimescaffoldingreturn: {
    type: Date,
  },

  lengthoutscaffolding: {
    type: Number,
  },

  heightoutscaffolding: {
    type: Number,
  },

  quantityscaffolding: {
    type: Number,
  },

  breadthscaffolding: {
    type: Number,
  },

  cuplock10ftno: {
    type: Number,
  },

  cuplock5ftno: {
    type: Number,
  },

  cuplock8ftno: {
    type: Number,
  },

  ledger5ftno: {
    type: Number,
  },

  ledger3ftno: {
    type: Number,
  },

  currentLedger6ft5in: {
    type: Number,
  },

  pinscaffoldingno: {
    type: Number,
  },

  // NEW: Base Jack returned
  basejackno: {
    type: Number,
    default: 0,
  },

  // NEW: Ledger 1.5ft returned
  ledger1_5ftno: {
    type: Number,
    default: 0,
  },

  comment: {
    type: String,
  },

  labourfitting: {
    type: String,
  },

  labourremoving: {
    type: String,
  },

  transportgoing: {
    type: String,
  },

  transportcoming: {
    type: String,
  },

  woodernchaliscaffolding: {
    type: Number,
  },

  steelchalscaffolding: {
    type: Number,
  },

  wheelscaffolding: {
    type: Number,
  },

  onngoing: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'returnitem',
  }],

  mtTick: {
    type: 'string',
  },

  currentQuantity: {
    type: Number,
  },

  parentOut: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'scaffoldingout'
  }

});

const scaffoldingin = mongoose.model(
  'scaffoldingin',
  scaffoldinginSchema
);

module.exports = scaffoldingin;
