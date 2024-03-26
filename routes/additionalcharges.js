const mongoose = require('mongoose');

const additionalchargesSchema = new mongoose.Schema({
    additionalchargesName: {
    type: String,
  },
  additionalchargesCost: {
    type: Number,
  },
  
  recieptt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'reciept', 
  },
});

const additionalcharges = mongoose.model('additionalcharges', additionalchargesSchema); // Fix the schema name here

module.exports = additionalcharges;
