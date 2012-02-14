var fs = require('fs'),
    util = require('util'),
    flatiron = require('flatiron'),
    ecstatic = require('ecstatic');

var HTTPServer = exports.HTTPServer = function (options) {
  options = options || {};

  flatiron.App.call(this, options);

  if (options.root) {
    this.root = options.root;
  }
  else {
    try {
      fs.lstatSync('./public');
      this.root = './public';
    }
    catch (err) {
      this.root = './';
    }
  }

  this.cache = options.cache || 3600; // in seconds.
  this.autoIndex = options.autoIndex !== false;
};
util.inherits(HTTPServer, flatiron.App);

HTTPServer.prototype.listen = function (port, host, callback) {
  this.use(flatiron.plugins.http, {
    before: [
      ecstatic(this.root, {
        autoIndex: this.autoIndex,
        cache: this.cache
      })
    ]
  });
  return this.start(port, host, callback);
};

HTTPServer.prototype.close = function () {
  return this.server.close();
};

exports.createServer = function (options) {
  return new HTTPServer(options);
};
