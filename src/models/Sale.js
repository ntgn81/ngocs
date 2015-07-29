var mongoose = require('mongoose');

var SaleSchema = new mongoose.Schema({
  igMediaId: String,
  link: String,
  user: {
    username: String,
    profile_picture: String,
    id: String,
    full_name: String
  }
}, {
  versionKey: false
});

module.exports = mongoose.model('Sale', SaleSchema);
