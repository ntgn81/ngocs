var mongoose = require('mongoose');
var ig = require('instagram-node').instagram();
var Order = require('../models/Order');
var Sale = require('../models/Sale');
var _ = require('lodash');
var async = require('async');
var config = require('../config/config.js');

module.exports = scrapeComments;

ig.use(config.instagram);
mongoose.connect(config.mongodb.connectionString);

function scrapeComments() {
  Sale.find({
    igMediaId: {
      $exists: true
    }
  }, function(err, sales) {
    if (err) return console.dir(err);

    processSales(sales);
    sales.forEach(processSale);
  });
}

function processSales(sales) {
  async.waterfall([
    getComments.bind(this, sales),
    getNewComments,
    createOrders
  ], function(err) {
    console.dir(err);
  });
}

function createOrders(comments, cb) {
  console.dir('creating orders - ' + comments.length);
  comments.forEach(function(c) {
    var mediaId = c.mediaId;
    delete c.mediaId;
    new Order({
      igMediaId: mediaId,
      sourceComment: c,
      state: 'scraped'
    }).save();
  });
}
 
// get comments for all the sales posts
function getComments(sales, cb) {
  async.map(sales,
    function(sale, aCb) {
      ig.comments(sale.igMediaId, function(err, comments) {
        if (err) return console.dir(err);
        var igComments = comments || [];
        comments.forEach(function(c) {
          c.mediaId = sale.igMediaId;
        });
        aCb(null, comments || []);
      });
    },
    function(err, results) {
      cb(null, _.flatten(results));
    }
  );
}

// get new comments - the ones that don't exist
function getNewComments(comments, cb) {
  Order.find({
    'sourceComment.id': {
      '$in': _.map(comments, 'id')
    }
  }, 'sourceComment.id', function(err, orders) {
    if (err) {
      console.dir(err);
      return cb(null, []);
    }
    var existingCommentIds = _.map(orders, function(o) {
      return o.sourceComment.id;
    });

    var newComments = _.filter(comments, function(c) {
      return !_.includes(existingCommentIds, c.id);
    });

    cb(null, newComments);
  });
}

function processSale(sale) {
  // get comments for the sales post
  ig.comments(sale.igMediaId, function(err, comments) {
    if (err) return console.dir(err);


  });
}
