const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  name: { type: String, default: "Cash" }, // Defaults to "Cash" if not provided
  address: { type: String },
  phone: { type: String },
  items: [{
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
