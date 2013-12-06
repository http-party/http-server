var fs = require('fs'),
    util = require('util'),
    union = require('union'),
    ecstatic = require('ecstatic'),
    auth = require('http-auth');

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

  // Setup basic auth if specified
  if (this.user || this.pass) {
    var basic = auth.basic({
        realm: 'Please log in.'
      }, function(user, pass, cb) {
        var isAuthenticated = (user === that.user && pass === that.pass);
        cb(isAuthenticated);
      }
    );

    this.before.push(auth.connect(basic)); // use connect style middleware with `union`
  }

  if (options.ext) {
    this.ext = options.ext === true
      ? 'html'
      : options.ext;
  }

  this.server = union.createServer({
    before: (this.before || []).concat([
      function (req, res) {
        options.logFn && options.logFn(req, res);
        res.emit('next');
      },
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
