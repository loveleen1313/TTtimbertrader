const mongoose = require('mongoose');

const itembuySchema = new mongoose.Schema({

    itembuyserialnumber: {
        type: Number, 
        },
 name:
  {
    type: String, 
  },
  price : {
    type: Number, 
  },
 
  comment: {
    type: String, 
  },
  
});

const itembuy = mongoose.model('itembuy', itembuySchema);

module.exports = itembuy;
