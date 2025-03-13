// models/Labour.js
const mongoose = require('mongoose');

const labourSchema = new mongoose.Schema({
    name: String,
phoneno: Number,
address: String,
comment: String,
salary: Number,
    advances:[ {
        
        type: mongoose.Schema.Types.ObjectId,
        ref: 'moneyinandout', 
      }],
    holidays: [{ type: Date }],
    halfDays: [{ type: Date }],
    details: String
});

module.exports = mongoose.model('Labour', labourSchema);
