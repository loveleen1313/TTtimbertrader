const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({

    itembuynumber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'itembuy', 
        },
 name:
  {
    type: String, 
  },
  phno : {
    type: Number, 
  },
 address: {
    type: String, 
  },
  comment: {
    type: String, 
  },
  
});

const supplier = mongoose.model('supplier', supplierSchema);

module.exports = supplier;
