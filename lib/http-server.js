var flatiron = require('flatiron'),
    path = require('path'),
    argv = require('optimist').argv,
    colors = require('colors'),
    ecstatic = require('ecstatic'),
    app = flatiron.app;

var server = module.exports;

var opts = {
  root: argv._[0] || (path.existsSync("./public") ? "./public" : "./"),
  port: argv.p || 8080,
  host: argv.a || 'localhost',
  cache: argv.c || 3600, // in seconds.
  autoIndex: argv.i || true,
  silent: argv.s || argv.silent || false,
  help: argv.h || argv.help
}

var showHelp = function () {
  var help = [
      "usage: http-server [path] [options]",
      "",
      "options:",
      " -p Port to use [8080]",
      " -a Address to use [localhost]",
      " -i Display autoIndex [true]",
      " -s --silent Suppress log messages from output",
      " -h --help Print this list and exit.",
  ].join('\n');
  console.log(help);
}

server.start = function (overrides) {
  if (overrides) {
    Object.keys(overrides).forEach(function (k) {
      opts[k] = overrides[k];
    });
  }

  if (opts.help) {
    return showHelp();
  }

  server.log('Starting up http-server, serving '.yellow
    + opts.root.cyan
    + ' on port: '.yellow
    + opts.port.toString().cyan);


  //TODO: Add 404 file behavior to ecstatic, make configurable
  app.use(flatiron.plugins.http, {
    before: [
      ecstatic(opts.root, {
        autoIndex: opts.autoIndex,
        cache: opts.cache
      })
    ]
  });

  app.init(app.start.bind(app, opts.port, opts.host));

  server.log('http-server successfully started: '.green
            + 'http://'.cyan
            + opts.host.cyan
            + ':'.cyan
            + opts.port.toString().cyan);
  server.log('Hit CTRL-C to stop the server');
}

server.log = function (message) {
  if (!opts.silent) {
    console.log(message);
  }
}
