const mongoose = require('mongoose');

const farmaoutSchema = new mongoose.Schema({
    Dateandtimefarma: {
      type: Date,    
    },

  length1farma: {
    type: String, 
  },
  length2farma: {
    type: String,   
  },
  heightfarma: {
    type: String,   
  },

  plate9inchfarma: {
    type: Number,  
  },

  plate12inchfarma: {
    type: Number,  
  },

  plate15inchfarma: {
    type: Number,
  },

  plate18inchfarma: {
    type: Number,
  },

  plate21inchfarma: {
    type: Number,
  },

  plate24inchfarma: {
    type: Number,
  },
  plate27inchfarma: {
    type: Number,
  },

  rentpersetfarma: {
    type: Number,
  },

  noofsetsfarma: {
    type: Number,
  },
  onngoing: [{
    type : mongoose.Schema.Types.ObjectId,
    ref: 'returnitem',
  }],
});

const farmaout = mongoose.model('farmaout', farmaoutSchema);

module.exports = farmaout;
