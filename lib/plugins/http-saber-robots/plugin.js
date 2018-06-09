/**
 * A robots file plugin for http-saber
 * @author Kosher Jungle Cat
 */

var httpServer = require('../../http-saber');

module.exports = plugin;

function plugin(data, host) {
  host.events.on(httpServer.EVENTS.INIT, robots);
  return {};
}

function robots(options, unionOptions, instance) {
  if (options.robots) {
    unionOptions.before.push(function (req, res) {
      if (req.url === '/robots.txt') {
        res.setHeader('Content-Type', 'text/plain');
        var robots = options.robots === true
            ? 'User-agent: *\nDisallow: /'
            : options.robots.replace(/\\n/, '\n');

        return res.end(robots);
      }

      res.emit('next');
    });
  }
}
