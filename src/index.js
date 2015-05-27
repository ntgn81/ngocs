var schedule = require('node-schedule');

// Cron style scheduling
var everyHour = '0 * * * *';
var everyFiveMinutes = '*/5 * * * *';


schedule.scheduleJob(everyHour, function(){
  console.log('One minute rule');
});
schedule.scheduleJob(everyFiveMinutes, function(){
  console.log('Two minute rule');
});