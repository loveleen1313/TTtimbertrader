const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  name: { type: String, default: "Cash" }, 
  address: { type: String },
  phone: { type: String },
  date: { type: Date, default: Date.now }, 
  items: [{
    itemName: { type: String },
    quantity: { type: Number },
    price: { type: Number }
  }],
  additionalcharges:[ {   
      type: mongoose.Schema.Types.ObjectId,
      ref: 'additionalcharges', 
    }],
      moneyreceipt:[ {
        
        type: mongoose.Schema.Types.ObjectId,
        ref: 'moneyinandout', 
      }],
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);

