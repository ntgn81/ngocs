var mongoose = require('mongoose');
var ig = require('instagram-node').instagram();
var Order = require('../models/Order');
var Sale = require('../models/Sale');
var _ = require('lodash');
var async = require('async');
var config = require('../config/config.js');
var Logger = require('../utils/Logger.js');
var logger = new Logger('ScrapeComments');

module.exports = scrapeComments;

if (config.instagram.access_token) {
  ig.use({
    access_token: config.instagram.access_token
  })
}
else {
  ig.use({
    client_id: config.instagram.client_id,
    client_secret: config.instagram.client_secret
  })
}

function scrapeComments() {
  logger.log('Start');
  Sale.find({
    igMediaId: {
      $exists: true
    },
    user: {
      $exists: true
    }
  }, function(err, sales) {
    if (err) {
      return logger.log('Failed getting sales in DB: %j', err);
    }
    processSales(sales);
  });
}

function processSales(sales) {
  async.waterfall([
    getComments.bind(this, sales),
    getNewComments,
    createOrders
  ], function(err, orders) {
    if (err) {
      logger.log('Failed getting comments: %j', err);
    }
    else {
      logger.log('Scraped %s new orders', orders.length);
    }
  });
}

function createOrders(comments, cb) {
  comments.forEach(function(c) {
    var mediaId = c.mediaId;
    delete c.mediaId;
    new Order({
      igMediaId: mediaId,
      sourceComment: c,
      state: 'scraped'
    }).save();
  });
  cb(null, comments);
}
 
// get comments for all the sales posts
function getComments(sales, cb) {
  async.map(sales,
    function(sale, aCb) {
      ig.comments(sale.igMediaId, function(err, comments) {
        if (err) {
          logger.log('Failed retrieving comments for media id=%s: %j', sale.igMediaId, err);
          return aCb(null, []);
        }
        var igComments = comments || [];
        igComments.forEach(function(c) {
          c.mediaId = sale.igMediaId;
        });
        aCb(null, igComments);
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
      logger.log('Failed getting existing orders in DB: %j', err);
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