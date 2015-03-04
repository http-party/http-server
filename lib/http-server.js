var fs = require('fs'),
    util = require('util'),
    union = require('union'),
    ecstatic = require('ecstatic'),
    httpProxy = require('http-proxy');

var HTTPServer = exports.HTTPServer = function (options) {
  options = options || {};

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

  if (options.ext) {
    this.ext = options.ext === true
      ? 'html'
      : options.ext;
  }

  var serverOptions = {
    before: (options.before || []).concat([
      function (req, res) {
        if (options.logFn) {
          options.logFn(req, res);
        }

        res.emit('next');
      },
      ecstatic({
        root: this.root,
        cache: this.cache,
        showDir: this.showDir,
        autoIndex: this.autoIndex,
        defaultExt: this.ext,
        handleError: typeof options.proxy !== 'string'
      })
    ]),
    headers: this.headers || {}
  };

  if (typeof options.proxy === 'string') {
    var proxy = httpProxy.createProxyServer({});
    serverOptions.before.push(function (req, res) {
      proxy.web(req, res, {
        target: options.proxy,
        changeOrigin: true
      });
    });
  }

  if (options.https) {
    serverOptions.https = options.https;
  }

  this.server = union.createServer(serverOptions);
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
