/**
 * Logging plugin for http-saber
 * @author Assaf Moldavsky
 * @author Kosher Jungle Cat
 */

var httpServer = require('../../http-saber');

module.exports = plugin;

function plugin(data, host) {
  host.events.on(httpServer.EVENTS.INIT, logger);
  return {};
}

function logger(options, unionOptions, instance) {
  if (options.logFn) {
    unionOptions.before.push(function logger(req, res) {
      options.logFn(req,res);
      res.emit('next');
    });

    unionOptions.onError = function (err, req, res) {
      options.logFn(req, res, err);
      res.end();
    };
  }
}
