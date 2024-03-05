const mongoose = require('mongoose');
const postSchema = new mongoose.Schema({
    postText :{
        type: 'string',
        required: true,
    },
    image:{
        type: 'string',
    },
    CreatedAt: {
        type: Date,
        default: Date.now(),
    },
    likes: {
        type: 'array',
        default: [],
    },
    Users: {
        type : mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    
});
module.exports = mongoose.model('Post', postSchema);