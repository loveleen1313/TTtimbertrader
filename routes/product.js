const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/nayaappforgolous");

const itemSchema = new mongoose.Schema({
    itemName: {
      type: String,
      required: true,
    },
    rentPrice: {
      type: Number,
    },
    sellingPrice: {
      type: Number,
    },
    totalQuantity: {
      type: Number,
    },
    alertQuantity: {
      type: Number,
    },
    buyingPrice: {
      type: Number,
    },
    workingQuantity : {
      type: Number,
    },
    comment: {
      type: String,
    },
    itemCategory: {
      type: String,
    },
    supplier: {
      type: String,
    },
    useIn: {
      type: String,
    },
    workingQuantity : {
      type: Number,
    },
  });
  
  // Create the Item model
  module.exports = mongoose.model('Item', itemSchema);
  
 