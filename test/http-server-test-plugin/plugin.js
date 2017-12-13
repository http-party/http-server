/**
 * A test plugin for http-server
 * @author Assaf Moldavsky
 */
var httpServer = require('../../lib/http-server');

module.exports = plugin;
module.exports.onInitCallback = null;
module.exports.onInitDoneCallback = null;
module.exports.onRequestCallback = null;

function plugin(data, host) {
  host.events.on(httpServer.EVENTS.INIT, onInitTest);
  host.events.on(httpServer.EVENTS.INIT, onInitDoneTest);
  return {};
}

function onInitTest(options, unionOptions) {
  unionOptions.before.unshift(requestInterecptor);
  module.exports.onInitCallback && module.exports.onInitCallback(options, unionOptions);
}

function onInitDoneTest(options, unionOptions, server) {
  module.exports.onInitDoneCallback && module.exports.onInitDoneCallback(options, unionOptions, server);
}

function requestInterecptor(req, res) {
  module.exports.onRequestCallback && module.exports.onRequestCallback(req,res);
  res.emit('next');
}

