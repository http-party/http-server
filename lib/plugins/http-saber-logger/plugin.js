/**
 * Logging plugin for http-saber
 * @author Assaf Moldavsky
 * @author Kosher Jungle Cat
 */

var httpServer = require('../../http-saber');

module.exports = plugin;

function plugin() {
  return {
    usage: usage,
    init: init
  };
}

function usage() {
  console.log([
    'usage: http-saber --logger [option]',
    '',
    'options:',
    '  utc     Use UTC time format in log messages.'
  ]);
}

function init(host) {
  host.events.on(httpServer.EVENTS.INIT, logger);
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
