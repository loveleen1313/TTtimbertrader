const mongoose = require('mongoose');

const daybookSchema = new mongoose.Schema({
  daybookinandout: {
    type: String,
    required: true, // Add required or other constraints as needed
  },
  comment: {
    type: String,
    required: false, // Optional field
  },
  Dateandtimedaybook: {
    type: Date,
    required: false, // Add required or other constraints as needed
  },
  maker : {
    type: String,
    required: false, // Optional field
  },
});

const Daybook = mongoose.model('Daybook', daybookSchema);

module.exports = Daybook;
