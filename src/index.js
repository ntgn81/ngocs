var schedule = require('node-schedule');
var config = require('./config/config');
var mongoose = require('mongoose');

// Cron style scheduling
var everyHour = '0 * * * *';
var everyFiveMinutes = '*/5 * * * *';

mongoose.connect(config.mongodb.connectionString, start);

// return require('./jobs/extract-details')();
// every 30 minutes
function start() {
  schedule.scheduleJob('0,10,20,30,40,50 * * * *', require('./jobs/scrape-comments'));
  schedule.scheduleJob('2,12,22,32,42,52 * * * *', require('./jobs/extract-details'));
  schedule.scheduleJob('4,14,24,34,44,54 * * * *', require('./jobs/temp-send-csv'));
}