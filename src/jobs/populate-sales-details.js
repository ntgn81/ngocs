var mongoose = require('mongoose');
var ig = require('instagram-node').instagram();
var Order = require('../models/Order');
var Sale = require('../models/Sale');
var _ = require('lodash');
var async = require('async');
var config = require('../config/config.js');
var Logger = require('../utils/Logger.js');
var logger = new Logger('PopulateSalesDetails')();

module.exports = populateSalesDetails;

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

function populateSalesDetails() {
  logger.log('Start');
  Sale.find({
    "$or": [
      {
        "user": { "$exists": false }
      },
      { "link": "" }
    ]
  }, function(err, sales) {
    if (err) {
      return logger.log('Failed getting sales in DB: %j', err);
    }
    
    logger.log('Processing %s sales', sales.length);
    
    sales.forEach(populateSaleDetails);
  });
}

function populateSaleDetails(sale) {
    if (sale.igMediaId) {
        ig.media(sale.igMediaId, processData);
    }
    else if (sale.link) {
        var matches = /instagram.com\/p\/(.*)\//.exec(sale.link);
        if (matches && matches.length > 1) {
          ig.media_shortcode(matches[1], processData);
        }
    }
    
    function processData(err, igData) {
        if (err) {
            return logger.log('Failed getting details for photo: %s', sale.igMediaId || sale.igMediaShortcode);
        }
        sale.user = igData.user;
        sale.link = igData.link;
        sale.save();
    }
}