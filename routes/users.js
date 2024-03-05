require('events').EventEmitter.defaultMaxListeners = 15; 
const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');


mongoose.connect("mongodb://127.0.0.1:27017/nayaappforgolous");
const userSchema = new mongoose.Schema({
  username: {
    type: 'string',
    required: true,
    unique: true,
    
  },
  password: {
    type: 'string',
  },
  posts: [{
    type : mongoose.Schema.Types.ObjectId,
    ref: 'Post',
  }],

  dp:{
    type: 'string',
  },
  email:{
    type: 'string',
    required: true,
    unique: true,
   
  },
  fullname : {
    type: 'string',
  },
});

userSchema.plugin(plm);
module.exports = mongoose.model('User', userSchema);
