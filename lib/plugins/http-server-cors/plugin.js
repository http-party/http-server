/**
 * A test plugin for http-server
 * @author Assaf Moldavsky
 * @author Chunky Space Robot
 */

var httpServer = require('../../http-server'),
    corser = require('corser');

module.exports = plugin;

function plugin(data, host) {
  host.events.on(httpServer.EVENTS.INIT, cors);
  return {};
}

function cors(options, unionOptions, instance) {
  if (options.cors) {
    instance.headers['Access-Control-Allow-Origin'] = '*';
    instance.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Range';
    if (options.corsHeaders) {
      options.corsHeaders.split(/\s*,\s*/)
          .forEach(function (h) { instance.headers['Access-Control-Allow-Headers'] += ', ' + h; }, instance);
    }
    var corsReqHandler = corser.create(options.corsHeaders ? {
      requestHeaders: instance.headers['Access-Control-Allow-Headers'].split(/\s*,\s*/)
    } : null);
    unionOptions.before.push(corsReqHandler);
  }
}
