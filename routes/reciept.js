const mongoose = require('mongoose');

const ttreceiptSchema = new mongoose.Schema({


    receiptdate: {
        type: Date,
    },


  receiptChallannumber: {
    type: String,
    
  },
  comment: {
    type: String,
    
  },
  final: {
    type: Number,
    
  },
  flag: {
    type: Number,
},

  receiptclientname: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client', 
    },

    receiptclientsitename: 
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clientsite',  
  },

  generalitemreceipt:[ {
    
    type: mongoose.Schema.Types.ObjectId,
    ref: 'genearalout', 
  }],
  scaffoldingitemreceipt:[ {
    
    type: mongoose.Schema.Types.ObjectId,
    ref: 'scaffoldingout', 
  }],
  
  farmaitemreceipt:[ {
    
    type: mongoose.Schema.Types.ObjectId,
    ref: 'farmaout', 
  }],
  moneyreceipt:[ {
    
    type: mongoose.Schema.Types.ObjectId,
    ref: 'moneyinandout', 
  }],
  generalinreceipt:[ {
    
    type: mongoose.Schema.Types.ObjectId,
    ref: 'returnitem', 
  }],
  scaffoldinginreceipt:[ {   
    type: mongoose.Schema.Types.ObjectId,
    ref: 'returnitem', 
  }],
});

const ttreceipt = mongoose.model('ttreceipt', ttreceiptSchema);

module.exports = ttreceipt;