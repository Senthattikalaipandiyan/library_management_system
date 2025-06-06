const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  username: String,
  text: String,
  date: String
}, { _id: false });

const bookSchema = new mongoose.Schema({
  name: String,
  writer: String,
  journals: String,
  imageUrl: String,
  comments: {
    type: [commentSchema],
    default: []
  }
});

module.exports = mongoose.model('Book', bookSchema);
