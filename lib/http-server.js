'use strict';

var fs = require('fs'),
  union = require('union'),
  ecstatic = require('ecstatic'),
  auth = require('basic-auth'),
  httpProxy = require('http-proxy'),
  corser = require('corser'),
  secureCompare = require('secure-compare');

//
// Remark: backwards compatibility for previous
// case convention of HTTP
//
exports.HttpServer = exports.HTTPServer = HttpServer;

/**
 * Returns a new instance of HttpServer with the
 * specified `options`.
 */
exports.createServer = function (options) {
  return new HttpServer(options);
};

/**
 * Constructor function for the HttpServer object
 * which is responsible for serving static files along
 * with other HTTP-related features.
 */
function HttpServer(options) {
  var self = this;

  options = options || {};

  if (options.root) {
    self.root = options.root;
  }
  else {
    try {
      fs.lstatSync('./public');
      self.root = './public';
    }
    catch (err) {
      self.root = './';
    }
  }

  self.headers = options.headers || {};

  self.cache = (
    options.cache === undefined ? 3600 :
      // -1 is a special case to turn off caching.
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#Preventing_caching
      options.cache === -1 ? 'no-cache, no-store, must-revalidate' :
        options.cache // in seconds.
  );
  self.showDir = options.showDir !== 'false';
  self.autoIndex = options.autoIndex !== 'false';
  self.showDotfiles = options.showDotfiles;
  self.gzip = options.gzip === true;
  self.brotli = options.brotli === true;
  self.contentType = options.contentType || 'application/octet-stream';

  if (options.ext) {
    self.ext = options.ext === true
      ? 'html'
      : options.ext;
  }

  var before = options.before ? options.before.slice() : [];

  before.push(function (req, res) {
    if (options.logFn) {
      options.logFn(req, res);
    }

    res.emit('next');
  });

  if (options.username || options.password) {
    before.push(function (req, res) {
      var credentials = auth(req);

      // We perform these outside the if to avoid short-circuiting and giving
      // an attacker knowledge of whether the username is correct via a timing
      // attack.
      if (credentials) {
        var usernameEqual = secureCompare(options.username, credentials.name);
        var passwordEqual = secureCompare(options.password, credentials.pass);
        if (usernameEqual && passwordEqual) {
          return res.emit('next');
        }
      }

      res.statusCode = 401;
      res.setHeader('WWW-Authenticate', 'Basic realm=""');
      res.end('Access denied');
    });
  }

  if (options.cors) {
    self.headers['Access-Control-Allow-Origin'] = '*';
    self.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Range';
    if (options.corsHeaders) {
      options.corsHeaders.split(/\s*,\s*/)
        .forEach(function (h) { self.headers['Access-Control-Allow-Headers'] += ', ' + h; }, self);
    }
    before.push(corser.create(options.corsHeaders ? {
      requestHeaders: self.headers['Access-Control-Allow-Headers'].split(/\s*,\s*/)
    } : null));
  }

  if (options.robots) {
    before.push(function (req, res) {
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

  before.push(ecstatic({
    root: self.root,
    cache: self.cache,
    showDir: self.showDir,
    showDotfiles: self.showDotfiles,
    autoIndex: self.autoIndex,
    defaultExt: self.ext,
    gzip: self.gzip,
    brotli: self.brotli,
    contentType: self.contentType,
    handleError: typeof options.proxy !== 'string'
  }));

  if (typeof options.proxy === 'string') {
    self.proxyServer = httpProxy.createProxyServer({
      target: options.proxy,
      changeOrigin: options.changeOrigin
    });
    before.push(function (req, res) {
      self.proxyServer.web(req, res, {}, function (err, req, res, target) {
        if (options.logFn) {
          options.logFn(req, res, {
            message: err.message,
            status: res.statusCode
          });
        }
        res.emit('next');
      });
    });
  }

  var serverOptions = {
    before: before,
    headers: self.headers,
    onError: function (err, req, res) {
      if (options.logFn) {
        options.logFn(req, res, err);
      }

      res.end();
    }
  };

  if (options.https) {
    serverOptions.https = options.https;
  }

  self.server = union.createServer(serverOptions);

  if (self.proxyServer && options.websocket) {
    self.server.on('upgrade', function (request, socket, head) {
      self.proxyServer.ws(request, socket, head);
    });
  }
}

HttpServer.prototype.listen = function () {
  this.server.listen.apply(this.server, arguments);
};

HttpServer.prototype.close = function () {
  return this.server.close();
};
