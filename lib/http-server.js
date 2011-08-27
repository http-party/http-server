/* 
 *
 * http-server.js - A simple static HTTP server.
 *
 * (c) 2011 Nodejitsu Inc.
 *
 */

var static = require('../vendor/node-static/lib/node-static'),
    http = require('http');

var HTTPServer = exports.HTTPServer = function (options) {
  var defaults = {
    root: options.root || ".",
    port: options.port || 8080,
    host: options.host || 'localhost',
    cache: options.cache || 3600,
    autoIndex: options.autoIndex || true,
    silent: options.silent || false
  }
  for (var o in options) {
    this[o] = options[o] || defaults[o];
  }
  this.file = new(static.Server)(this.root, { autoIndex: this.autoIndex, cache: Number(this.cache) });
}

HTTPServer.prototype.start = function () {
  var self = this;
  http.createServer(function(request, response) {
    request.on('end', function() {
      self.log('[served] ' + request.url);
      return self.file.serve(request, response);
    });
  }).listen(self.port);
}

HTTPServer.prototype.log = function (message) {
  if (!this.silent) {
    console.log(message);
  }
}

