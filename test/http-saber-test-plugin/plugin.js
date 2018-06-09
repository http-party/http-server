/**
 * A test plugin for http-saber
 * @author Assaf Moldavsky
 */
var httpServer = require('../../lib/http-saber');

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
  if (typeof module.exports.onInitCallback === 'function') {
    module.exports.onInitCallback(options, unionOptions);
  }
}

function onInitDoneTest(options, unionOptions, server) {
  if (typeof module.exports.onInitDoneCallback === 'function') {
    module.exports.onInitDoneCallback(options, unionOptions, server);
  }
}

function requestInterecptor(req, res) {
  if (typeof module.exports.onRequestCallback === 'function') {
    module.exports.onRequestCallback(req, res);
  }
  res.emit('next');
}

