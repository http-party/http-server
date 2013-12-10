var fs = require('fs'),
    util = require('util'),
    union = require('union'),
    ecstatic = require('ecstatic'),
    auth = require('basic-auth-parser');

var HTTPServer = exports.HTTPServer = function (options) {
  options = options || {};
  var that = this;

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

  if (options.headers) {
    this.headers = options.headers;
  }

  this.cache = options.cache || 3600; // in seconds.
  this.showDir = options.showDir !== 'false';
  this.autoIndex = options.autoIndex !== 'false';
  this.user = options.user || '';
  this.pass = options.pass || '';

  this.before = []; // The middleware to run before the static server

  // Add logging middleware
  this.before.push(
    function (req, res) {
      options.logFn && options.logFn(req, res);
      res.emit('next');
  });

  // Setup basic auth if specified
  if (this.user || this.pass) {
    this.before.push(function (req, res) {
      var header = req.headers['authorization'],
          parsedAuth;

      if (header)
        parsedAuth = auth(req.headers['authorization']);

      if (parsedAuth
          && parsedAuth.username === that.user
          && parsedAuth.password === that.pass) {
        res.emit('next');
      } else {
        res.setHeader('WWW-Authenticate', 'Basic realm="please authenicate"');
        res.writeHead(401);
        res.end('401 Unauthenticated');
      }
    });
  }

  if (options.ext) {
    this.ext = options.ext === true
      ? 'html'
      : options.ext;
  }


  this.server = union.createServer({
    before: (this.before || []).concat([
      ecstatic({
        root: this.root,
        cache: this.cache,
        showDir : this.showDir,
        autoIndex: this.autoIndex,
        defaultExt: this.ext
      })
    ]),
    headers: this.headers || {}
  });
};

HTTPServer.prototype.listen = function () {
  this.server.listen.apply(this.server, arguments);
};

HTTPServer.prototype.close = function () {
  return this.server.close();
};

exports.createServer = function (options) {
  return new HTTPServer(options);
};
