const mongoose = require('mongoose');

const genearaloutSchema = new mongoose.Schema({
  itemoutname: {
    type: String,
    
  },
  Quantity: {
    type: Number,
    
  },
  Dateandtime: {
    type: Date,
  
  },
  rent: {
    type: Number,
  },
  onngoing: [{
    type : mongoose.Schema.Types.ObjectId,
    ref: 'returnitem',
  }],
});

const genearalout = mongoose.model('genearalout', genearaloutSchema);

module.exports = genearalout;
