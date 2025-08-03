const mongoose = require('mongoose');

const scaffoldingoutSchema = new mongoose.Schema({
  Dateandtimescaffolding: {
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
  rentmultipledayscaffolding: {
    type: Number,
  },

  numberofdayscaffolding: {
    type: Number,
  },

  rateafterdayscaffolding: {
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
  ledger6ft5inchno: {
    type: Number,
  },
  pinscaffoldingno: {
    type: Number,
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
    type : mongoose.Schema.Types.ObjectId,
    ref: 'returnitem',
  }],
  returnscaffolding :[{
type : mongoose.Schema.Types.ObjectId,
    ref: 'scaffoldingin',

  }],
 
});

const scaffoldingout = mongoose.model('scaffoldingout', scaffoldingoutSchema);

module.exports = scaffoldingout;
