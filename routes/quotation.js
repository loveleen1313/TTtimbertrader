const mongoose = require("mongoose");

const quotationItemSchema = new mongoose.Schema({
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        required: true
    },

    quantity: {
        type: Number,
        default: 1
    },

    rate: {
        type: Number,
        required: true
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

    amount: Number
});

const quotationSchema = new mongoose.Schema({

    quotationNo: {
        type: String,
        unique: true
    },

    quotationDate: {
        type: Date,
        default: Date.now
    },

    validTill: Date,

    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Client",
        required: true
    },

    items: [quotationItemSchema],

    transportCharge: {
        type: Number,
        default: 0
    },

    discount: {
        type: Number,
        default: 0
    },

    subtotal: Number,

    cgst: Number,

    sgst: Number,

    igst: Number,

    grandTotal: Number,

    notes: String,

    terms: [String],

    status: {
        type: String,
        enum: ["Draft", "Sent", "Accepted", "Rejected"],
        default: "Draft"
    },

    convertedToReceipt: {
        type: Boolean,
        default: false
    }

});

module.exports = mongoose.model("Quotation", quotationSchema);