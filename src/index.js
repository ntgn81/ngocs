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
  console.log('Connected to DB, starting scheduler');
  schedule.scheduleJob('*/10 * * * *', require('./jobs/scrape-comments'));
  schedule.scheduleJob('*/5+2 * * * *', require('./jobs/extract-details'));
  schedule.scheduleJob('*/5+4 * * * *', require('./jobs/temp-send-csv'));
}