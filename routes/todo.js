const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  name: {
    type: String,

  },
  work: {
    type: Number,
  }
});

const todo = mongoose.model('todo', todoSchema);

module.exports = todo;