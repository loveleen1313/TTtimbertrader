const mongoose = require('mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/nayaappforgolous");

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
  clientsite:[ {
    
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clientsite', 
    
  }],
});

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
