var util = require('util');
var mongoose = require('mongoose');
var ig = require('instagram-node').instagram();
var Order = require('../models/Order');
var Sale = require('../models/Sale');
var _ = require('lodash');
var async = require('async');
var config = require('../config/config.js');
var Logger = require('../utils/Logger.js');
var logger = new Logger('ExtractDetails');

module.exports = extractDetails;
function extractDetails() {
  logger.log('Start');
  Order.find({
    state: 'scraped'
  }, function(err, orders) {
    if (err) {
      return logger.log('Failed to retrieved scraped orders: %j', err);
    }
    
    logger.log('Found %s to be processed', orders.length);
    
    orders.forEach(function(o) {
      o.email = extractEmail(o.sourceComment.text);
      o.color = extractColor(o.sourceComment.text);
      o.state = o.email ? 'pending-details-validation' : 'not-valid';
      o.save(function(err) {
        if (err) {
          logger.log('Error updating order: %j', err);
        }
      });
    });
  });
}

function extractEmail(comment) {
  var regexp = /([a-z0-9._-]+@[a-z0-9._-]+\.[a-z0-9._-]+)/i;
  var matches = regexp.exec(comment);
  if (matches && matches.length) {
      return matches[0];
  }
}

function extractColor(comment) {
  if (!comment) {
      return '';
  }
  var withoutEmailsAndTags =
    comment
      .replace(/([a-z0-9._-]+@[a-z0-9._-]+\.[a-z0-9._-]+)/ig, '')
      .replace(/[@|#]\w\w+/g, '');
  
  if (/teal|turquoise|torquoise|blue/i.test(withoutEmailsAndTags)) {
    return 'teal';
  }
  
  if (/pink/i.test(withoutEmailsAndTags)) {
    return 'pink';
  }
  
  if (/white/i.test(withoutEmailsAndTags)) {
    return 'white';
  }
  
  if (/black/i.test(withoutEmailsAndTags)) {
    return 'black';
  }
  
  if (/green/i.test(withoutEmailsAndTags)) {
    return 'green';
  }
  
  return '';
}