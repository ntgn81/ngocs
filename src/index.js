var schedule = require('node-schedule');

// Cron style scheduling
var everyHour = '0 * * * *';
var everyFiveMinutes = '*/5 * * * *';

// every 30 minutes
schedule.scheduleJob('0/15 * * * *', require('./jobs/scrape-comments'));
schedule.scheduleJob('0/5 * * * *', require('./jobs/extract-details'));