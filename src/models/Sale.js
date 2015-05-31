var mongoose = require('mongoose');

module.exports = mongoose.model('Sale', {
  igMediaId: String,
  link: String,
  user: {
    username: String,
    profile_picture: String,
    id: String,
    full_name: String
  }
});
