const mongoose = require('mongoose');
const returnSchema = new mongoose.Schema({
    Itemname :{
        type: 'string',
    },
    comment :{
        type: 'string',
    },
    quantity:{
        type: 'string',
    },
    returndateAt: {
        type: Date,
      
    },
    returndateActual: {
        type: Date, 
    },
    
    ongoing: {
        type : mongoose.Schema.Types.ObjectId,
        ref: 'genearalout',
      },
        
    receipt: {
        type : mongoose.Schema.Types.ObjectId,
        ref: 'ttreceipt',
      },
    
});
module.exports = mongoose.model('returnitem', returnSchema);