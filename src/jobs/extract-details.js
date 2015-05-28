var mongoose = require('mongoose');
var ig = require('instagram-node').instagram();
var Order = require('../models/Order');
var Sale = require('../models/Sale');
var _ = require('lodash');
var async = require('async');
var config = require('../config/config.js');

module.exports = extractDetails;

mongoose.connect(config.mongodb.connectionString);

function extractDetails() {
  console.log('Extracting details');
  Order.find({
    state: 'scraped'
  }, function(err, orders) {
    if (err) {
      return console.dir(err);
    }
    
    orders.forEach(function(o) {
      o.email = extractEmail(o.sourceComment.text);
      o.color = extractColor(o.sourceComment.text);
      o.state = o.email ? 'pending-details-validation' : 'not-valid';
      o.save(function(err) {
        if (err) {
          console.log('Error saving');
          console.dir(err);
        }
      });
      //console.log('%s -> %s - %s', o.sourceComment.text, o.email, o.color);
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