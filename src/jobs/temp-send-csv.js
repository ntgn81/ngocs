var mongoose = require('mongoose');
var ig = require('instagram-node').instagram();
var Order = require('../models/Order');
var Sale = require('../models/Sale');
var _ = require('lodash');
var async = require('async');
var config = require('../config/config.js');
var util = require('util');
var Logger = require('../utils/Logger.js');
var logger = new Logger('Package&Send-CSV');
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
  Order.find({
    email: {
      $exists: true
    },
    tempPackagedInExcelAndSent: {
      $in: [
        null,
        false
      ]
    }
  }, function(err, orders) {
    if (err || !orders || !orders.length) {
      logger.log('No new orders');
      return;
    }
    logger.log('Found %s new orders', orders.length);
    var csv = 'Email,Color,UserName,FullName,Comment';
    orders.forEach(function(o) {
        csv += util.format('\n%s,%s,"%s","%s","%s"',
            o.email, o.color,
            o.sourceComment.from.username.replace('"', '""'),
            o.sourceComment.from.full_name.replace('"', '""'),
            o.sourceComment.text.replace('"', '""'));
    })
    
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
        orders.forEach(function(o) {
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