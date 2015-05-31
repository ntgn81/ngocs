var schedule = require('node-schedule');
var config = require('./config/config');
var mongoose = require('mongoose');

mongoose.connect(config.mongodb.connectionString, start);

// return require('./jobs/extract-details')();
// every 30 minutes
function start() {
  console.log('Connected to DB, starting scheduler');
  // every 5 minutes
  schedule.scheduleJob('0,5,10,15,20,25,30,35,40,45,50,55 * * * *', require('./jobs/scrape-comments'));
  // every 5 minutes
  schedule.scheduleJob('1,6,11,16,21,26,31,36,41,46,51,56 * * * *', require('./jobs/populate-sales-details'));
  // every 5 minutes
  schedule.scheduleJob('2,7,12,17,22,27,32,37,42,47,52,57 * * * *', require('./jobs/extract-details'));
  // every 5 minutes
  schedule.scheduleJob('4,9,14,19,24,29,34,39,44,49,55,59 * * * *', require('./jobs/temp-send-csv'));
}