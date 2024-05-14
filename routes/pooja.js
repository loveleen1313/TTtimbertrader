const mongoose = require('mongoose');

const poojaSchema = new mongoose.Schema({
  Buyingrate: {
    type: Number,   
  },
  sellingrate: {
    type: Number,
    
  },
 Itemname: {
    type: String, 
  },
  quantity: {
    type: Number,
    
  },
});

const pooja = mongoose.model('pooja', poojaSchema);

module.exports = pooja;
