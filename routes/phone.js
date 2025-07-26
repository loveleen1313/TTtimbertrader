const mongoose = require('mongoose');

const phoneSchema = new mongoose.Schema({
  phonetalk: String,
  date: Date,
 receipt: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'ttreceipt',
}

});

module.exports = mongoose.model('phone', phoneSchema);


