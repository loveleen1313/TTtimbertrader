const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');


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

    unit: {
    type: String,
    default: "PCS"
},

gst: {
    type: Number,
    default: 18
},

hsn: {
    type: String,
    default: ""
},
  });
  
  // Create the Item model
  module.exports = mongoose.model('Item', itemSchema);
  
 