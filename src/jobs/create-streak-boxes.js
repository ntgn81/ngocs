var mongoose = require('mongoose');
var ig = require('instagram-node').instagram();
var Order = require('../models/Order');
var Sale = require('../models/Sale');
var _ = require('lodash');
var async = require('async');
var config = require('../config/config.js');
var Logger = require('../utils/Logger.js');
var logger = new Logger('CreateStreakBoxes');
var Streak = require('streakapi');

module.exports = createStreakBoxes;
Streak.init(config.streak.apiKey);
function createStreakBoxes() {
  logger.log('Start');
  async.parallel({
    orders: Order.find.bind(Order, {
      email: {
        $exists: true
      },
      tempPackagedInExcelAndSent: {
        $in: [
          null,
          false
        ]
      }
    }),
    sales: Sale.find.bind(Sale, {
      user: {
        $exists: true
      }
    })
  }, function(err, res) {
    if (err) {
      logger.log('Error calling DB for sales/orders');
      return;
    }
    
    if (!res.orders || !res.sales) {
      logger.log('Empty Orders or sales');
      return;
    }
    
    if (!res.orders.length) {
      logger.log('No new orders');
      return;
    }
    
    var igMediaIdToUser = res.sales.reduce(function(p, c) {
      p[c.igMediaId] = c.user.username;
      return p;
    }, {});
    var pipelineFields;

    logger.log('Found %s new orders', res.orders.length);
    
    Streak.Pipelines.Fields.getAll(config.streak.pipelineKey, function(fields) {
      pipelineFields = fields;
      async.eachSeries(res.orders, createStreakBox);
    }, function(err) {
      logger.log('Error getting pipeline fields ', err);
    })

    function createStreakBox(order, cb) {
      Streak.Boxes.create(config.streak.pipelineKey, {
        name: order.sourceComment.from.username
      }, function(box) {
        updateBoxFields(box, order, function() {
          order.tempPackagedInExcelAndSent = true;
          order.save(function(){
            cb();
          });
        });
      }, function(err) {
        logger.log('Error creating streakbox ', err);
        cb();
      })
    }
    
    function updateBoxFields(box, order, cb) {
      var fields = {
        'Email': order.email,
        'Color': order.color,
        'H@ndle': '@' + order.sourceComment.from.username,
        'Post': order.sourceComment.text,
        'Ambassador': '@' + igMediaIdToUser[order.igMediaId]
      }
      async.forEachOfSeries(fields, updateBoxField, function() {
        cb();
      })
      
      function updateBoxField(value, fieldName, aCb) {
        var field = _.find(pipelineFields, function(f) { return f.name === fieldName; });
        if (!field) return aCb();
        
        Streak.Boxes.Fields.update(box.boxKey, {
          key: field.key,
          value: value
        }, function() {
          aCb();
        }, function() {
          aCb();
        })
      }
    }
  });
}
