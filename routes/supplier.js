const mongoose = require('mongoose');
const SupplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactNumber: { type: String,  },
  address: { type: String,  },
  products: [
    {
      productName: { type: String,  },
      quantity: { type: Number,  },
      unitPrice: { type: Number,  },
      totalPrice: { type: Number },
    },
  ],
  totalSuppliedAmount: Number,
  paidAmount: { type: Number,  },
  pendingAmount: Number,
});

SupplierSchema.pre("save", function (next) {
  // Calculate totalPrice for each product
  this.products = this.products.map(prod => {
    prod.totalPrice = prod.quantity * prod.unitPrice;
    return prod;
  });
  // Compute totals
  this.totalSuppliedAmount = this.products.reduce((acc, prod) => acc + prod.totalPrice, 0);
  this.pendingAmount = this.totalSuppliedAmount - this.paidAmount;
  next();
});

module.exports = mongoose.model("Supplier", SupplierSchema);

