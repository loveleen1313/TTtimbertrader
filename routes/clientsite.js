const mongoose = require('mongoose');

const clientsiteSchema = new mongoose.Schema({
  clientNamesite: {
    type: String,
  },
  phonesite: {
    type: String,
  },
  addresssite: {
    type: String,
  },
  commentsite: {
    type: String,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client', // Assuming 'Client' is the name of your other model
  },
});

const Clientsite = mongoose.model('Clientsite', clientsiteSchema); // Fix the schema name here

module.exports = Clientsite;
