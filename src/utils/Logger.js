var util = require('util');

module.exports = Logger;

function Logger(namespace) {
  this.ns = namespace;
}

Logger.prototype.log = function() {
  var now = new Date();
  console.log(util.format('%s::[%s]::%s',
    this.ns,
    now.toUTCString(),
    util.format.apply(util, arguments)));
}