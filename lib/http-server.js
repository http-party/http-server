/* 
 *
 * http-server.js - A simple static HTTP server.
 *
 * (c) 2011 Nodejitsu Inc.
 *
 */

var colors = require('colors'),
    argv = require('optimist').argv,
    static = require('../vendor/node-static/lib/node-static'),
    http = require('http');

var HTTPServer = exports.HTTPServer = function (options) {
  this.root = argv._[0] || ".";
  this.port = argv.p || 8080;
  this.host = argv.a || 'localhost';
  this.cache = argv.c || 3600;
  this.autoIndex = argv.i || true;
  this.silent = argv.s || argv.silent || false;
  for (var o in options) {
    this[o] = options[o];
  }
  this.file = new(static.Server)(this.root, { autoIndex: this.autoIndex, cache: Number(this.cache) });
}
  

HTTPServer.prototype.start = function () {
  var self = this;
  if (argv.h || argv.help) {
    return showHelp();
  }
  self.log('Starting up http-server, serving '.yellow 
            + self.root.cyan 
            + ' on port: '.yellow 
            + self.port.toString().cyan);
  http.createServer(function(request, response) {
    request.on('end', function() {
      self.log('['.grey+'served'.yellow+'] '.grey + request.url);
      return self.file.serve(request, response);
    });
  }).listen(self.port);
  self.log('http-server successfully started: '.green 
            + 'http://'.cyan 
            + self.host.cyan 
            + ':'.cyan 
            + self.port.toString().cyan);
  self.log('Hit CTRL-C to stop the server')
}

HTTPServer.prototype.log = function (message) {
  if (!this.silent) {
    console.log(message);
  }
}

function showHelp() {
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
