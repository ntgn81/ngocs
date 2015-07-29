var mongoose = require('mongoose');
var ig = require('instagram-node').instagram();
var Order = require('../models/Order');
var Sale = require('../models/Sale');
var _ = require('lodash');
var async = require('async');
var config = require('../config/config.js');
var util = require('util');
var Logger = require('../utils/Logger.js');
var logger = new Logger('Package&Send-CSV')();
var nodemailer = require('nodemailer');

module.exports = packageAndSendCsv;

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'ntgn81.hidrate@gmail.com',
      pass: 'Hidrate123'
    }
});

function packageAndSendCsv() {
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

    logger.log('Found %s new orders', res.orders.length);
    var csv = 'Name,Last Name,Email,Ambassador,Stage,Post,H@andle,Color';
    res.orders.forEach(function(o) {
      csv += util.format('\n"%s","%s","%s","%s","%s","%s","%s","%s"',
        '', // name
        '', // last name
        o.email, // email
        '@' + igMediaIdToUser[o.igMediaId],// ambassador
        'lead', // stage
        '', // post
        '@' + o.sourceComment.from.username, // H@andle
        o.color);
    });
    
    var mailOptions = {
        from: 'Nam Nguyen <ntgn81@gmail.com>', // sender address
        to: config.tempEmailRecipients.join(','),// list of receivers
        subject: 'New instagram orders', // Subject line
        attachments: [{
          filename: 'orders.csv',
          content: csv
        }]
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(err, info){
        if(err){
          return logger.log('Error sending email: %j', err);
        }
        res.orders.forEach(function(o) {
          o.tempPackagedInExcelAndSent = true;
          o.save();
        })
    });
  });
}

function escapeForCsv(text){
  if (!text) return text;
  return text
}