const mongoose = require("mongoose"); // just mongoose


const clientSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  address: {
    type: String,
    required: true,
  },
  Proffession: {
    type: String,
  },
  comment: {
    type: String,
  },
  worksWith: {
    type: String,
  },
  dontknow: {
    type: String,
  },
  clientsite: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clientsite",
    },
  ],
  receiptinit: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "receipt",
    },
  ],
});

const Client = mongoose.model("Client", clientSchema);

module.exports = Client;
