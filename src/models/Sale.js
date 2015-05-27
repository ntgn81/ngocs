var mongoose = require('mongoose');

module.exports = mongoose.model('Sale', {
  igMediaId: String,
  igShortCode: String
});
