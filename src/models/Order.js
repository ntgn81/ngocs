var mongoose = require('mongoose');

var OrderSchema = new mongoose.Schema({
  igMediaId: String,
  sourceComment: {
    created_time: String,
    text: String,
    from: {
      username: String,
      profile_picture: String,
      id: String,
      full_name: String
    },
    id: String
  },
  email: String,
  address: String,
  color: {
    type: String,
    enum: [
      '',
      'white',
      'black',
      'pink',
      'teal',
      'green'  
    ]
  },
  lastModifiedDate: Date,
  state: {
    type: String,
    enum: [
      'scraped', // just pulled down from Instagram API, with just `igMediaId|sourceComment` fields populated.
      'pending-details-validation', // parsed out email and ordered item from comment's text. Awaiting admin to validate the order details
      'not-valid', // this comment is not an order - doesn't have email
      'details-validated', // order's details are validated by admin (making sure email/ordered item were extracted out correctly from comment's text)
      'awaiting-address-reply', // first email sent to user, now waiting for their reply with shipping address
      'shopping-cart-link-sent' // received address from user, created celery link, emailed the link back to user'
    ]
  },
  // temporary field used to keep track of which orders were packaged into excel
  // and sent to the team
  tempPackagedInExcelAndSent: Boolean
}, {
  versionKey: false
});

OrderSchema.pre('save', function(next) {
  var now = new Date();
  this.lastModifiedDate = new Date();
  if (!this.createdDate) {
    this.createdDate = now;
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);