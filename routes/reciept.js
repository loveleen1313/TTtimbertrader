const { text } = require('express');
const mongoose = require('mongoose');
const { stringify } = require('uuid');

const ttreceiptSchema = new mongoose.Schema({


    receiptdate: {
        type: Date,
    },

    Attachorderno: {
      type: String,
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
  sort: {
    type: Number, 
  },
  flag: {
    type: String ,
},
dropbox: {
  type: String ,
},
transportinfo: {
  type: String ,
},
nutboltfarma : {
  type: Number,
},
keyfarma : {
  type: Number,
},
callafter : {
  type: Number,
},
dropboxdate: {
  type: Date,
},
flagdate: {
  type: Date,
},
dropboxcomment: {
  type: String,
},
advancecomment: {
  type: String,
},
flagcomment: {
  type: String,
},
transportdate: {
  type: Date,
},
transport: {
  type: String,
},
transportcomment: {
  type: String,
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
  farmainreceipt:[ {
    
    type: mongoose.Schema.Types.ObjectId,
    ref: 'farmain', 
  }],
  scaffoldinginreceipt:[ {   
    type: mongoose.Schema.Types.ObjectId,
    ref: 'returnitem', 
  }],
  additionalcharges:[ {   
    type: mongoose.Schema.Types.ObjectId,
    ref: 'additionalcharges', 
  }],
});

const ttreceipt = mongoose.model('ttreceipt', ttreceiptSchema);

module.exports = ttreceipt;