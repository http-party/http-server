/**
 * A robots file plugin for http-saber
 * @author Kosher Jungle Cat
 */

var httpServer = require('../../http-saber');

module.exports = plugin;

function plugin() {
  return {
    init: init,
    usage: usage
  };
}

function usage() {
  console.log([
    'usage: ',
    '    http-saber --robots',
    '    http-saber -r',
    '',
    'Respond to /robots.txt [User-agent: *\\nDisallow: /]'
  ]);
}

function init(host) {
  host.events.on(httpServer.EVENTS.INIT, robots);
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
