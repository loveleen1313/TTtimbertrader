const mongoose = require('mongoose');

const buySchema = new mongoose.Schema({

  // Supplier Details
  supplier: {
    type: String
  },

  supplierAddress: {
    type: String
  },

  phone: {
    type: String
  },

  invoiceNo: {
    type: String,
    default: ""
  },

  // Purchase Date
  date: {
    type: Date,
    default: Date.now
  },

  // Materials Purchased
  items: [{
    itemName: {
      type: String
    },

    quantity: {
      type: Number
    },

    price: {
      type: Number
    }
  }],

  // Payments
// ======================================================
// PAYMENTS
// ======================================================

payments: [
    {
        mode: {
            type: String,
            enum: [
                "cash",
                "upi",
                "bank",
                "cheque",
                "other"
            ]
        },

        amount: {
            type: Number,
            default: 0
        },

        date: {
            type: Date,
            default: Date.now
        }
    }
],

// Total amount actually paid
paidAmount: {
    type: Number,
    default: 0
},

// Amount still payable to supplier
pendingAmount: {
    type: Number,
    default: 0
},
additionalCharges: [
    {
        description: {
            type: String,
            required: true
        },

        amount: {
            type: Number,
            default: 0
        }
    }
],

additionalChargesTotal: {
    type: Number,
    default: 0
},

totalAmount: {
    type: Number,
    default: 0
},
  // Remarks
  remarks: {
    type: String,
    default: ""
  },

  // If you later want to link payment/money receipt
  moneyreceipt: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'moneyinandout'
  }]

}, { timestamps: true });


module.exports = mongoose.model('Buy', buySchema);