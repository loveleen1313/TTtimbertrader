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
  ledger6ft5inchno: {
    type: Number,
  },
  pinscaffoldingno: {
    type: Number,
  },
  comment:
 {
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
    type : mongoose.Schema.Types.ObjectId,
    ref: 'returnitem',
  }],
   mtTick :{
    type: 'string',
},
});

const scaffoldingin = mongoose.model('scaffoldingin', scaffoldinginSchema);

module.exports = scaffoldingin;
