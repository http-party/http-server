var fs = require('fs'),
    util = require('util'),
    union = require('union'),
    ecstatic = require('ecstatic'),
    httpProxy = require('http-proxy');

var HTTPServer = exports.HTTPServer = function (options) {
  var proxyServer;
  options = options || {};

  if (options.proxy) {
    proxyServer = httpProxy.createProxyServer({});
    proxyServer.on('error', function (err, req, res) {
      res.writeHead(500, {
       'Content-Type': 'text/plain'
      });

      res.end('Something went wrong. And we are reporting a custom error message.');

      if (options.logFn) {
        console.log('failed proxy ' + options.proxy);
      }
    });
  }

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
    this.ext = options.ext === true ? 'html' : options.ext;
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
        handleError: !options.proxy
      }),
      function (req, res) {
        if (options.proxy) {
          if (options.logFn) {
            console.log('forwarding');
          }
          proxyServer.web(req, res, { target: options.proxy });
        }
        else {
          res.emit('next');
        }
      }
    ]),
    headers: this.headers || {}
  };

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
