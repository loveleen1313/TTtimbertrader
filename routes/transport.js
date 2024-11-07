const mongoose = require('mongoose');

const transportSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  phoneNumber: {
    type: Number,
  },
  plateNumber: {
    type: String,
  }
});

const transport = mongoose.model('transport', transportSchema);

module.exports = transport;