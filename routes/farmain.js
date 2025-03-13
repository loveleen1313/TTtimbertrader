const mongoose = require('mongoose');

const farmainSchema = new mongoose.Schema({
    returndateAt: {
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
  mtTick :{
    type: 'string',
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
 comment:
 {
  type: String,
 },
 receipt : {
  type : mongoose.Schema.Types.ObjectId,
  ref: 'ttreceipt',
},
  ongoing: {
     type : mongoose.Schema.Types.ObjectId,
     ref: 'farmaout',
   },
   mtTick :{
    type: 'string',
},
});

const farmain = mongoose.model('farmain', farmainSchema);

module.exports = farmain;
