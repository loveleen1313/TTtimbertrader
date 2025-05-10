const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  name: { type: String, default: "Cash" }, // Defaults to "Cash" if not provided
  address: { type: String },
  phone: { type: String },
  date: { type: Date, default: Date.now }, // ✅ Add date field with default to current date
  items: [{
    itemName: { type: String },
    quantity: { type: Number },
    price: { type: Number }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);

