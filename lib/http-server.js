'use strict';

var fs = require('fs'),
    union = require('union'),
    ecstatic = require('ecstatic'),
    httpProxy = require('http-proxy'),
    corser = require('corser'),
    pluginManager = new (require('js-plugins'))(),
    EventEmitter = require('events').EventEmitter;

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

exports.EVETNS = EVENTS;

/**
 * Constructor function for the HttpServer object
 * which is responsible for serving static files along
 * with other HTTP-related features.
 */
function HttpServer(options) {
  options = options || {};

  var _this = this;
  this._isInitDone = false;

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

  this.headers = options.headers || {};

  this.cache = options.cache === undefined ? 3600 : options.cache; // in seconds.
  this.showDir = options.showDir !== 'false';
  this.autoIndex = options.autoIndex !== 'false';
  this.showDotfiles = options.showDotfiles;
  this.gzip = options.gzip === true;
  this.contentType = options.contentType || 'application/octet-stream';

  if (options.ext) {
    this.ext = options.ext === true
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

  if (options.cors) {
    this.headers['Access-Control-Allow-Origin'] = '*';
    this.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Range';
    if (options.corsHeaders) {
      options.corsHeaders.split(/\s*,\s*/)
          .forEach(function (h) { this.headers['Access-Control-Allow-Headers'] += ', ' + h; }, this);
    }
    before.push(corser.create(options.corsHeaders ? {
      requestHeaders: this.headers['Access-Control-Allow-Headers'].split(/\s*,\s*/)
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
    root: this.root,
    cache: this.cache,
    showDir: this.showDir,
    showDotfiles: this.showDotfiles,
    autoIndex: this.autoIndex,
    defaultExt: this.ext,
    gzip: this.gzip,
    contentType: this.contentType,
    handleError: typeof options.proxy !== 'string'
  }));

  if (typeof options.proxy === 'string') {
    var proxy = httpProxy.createProxyServer({});
    before.push(function (req, res) {
      proxy.web(req, res, {
        target: options.proxy,
        changeOrigin: true
      });
    });
  }

  var serverOptions = {
    before: before,
    headers: this.headers,
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

  this.server = null;

  var _events = new EventEmitter();
  this._events = _events;

  var host = {
    events: this._events
  };
  pluginManager.scanSubdirs([__dirname + '/../test/']);
  pluginManager.scan();
  pluginManager.connect(host, 'http-server', { data: null },
      function (err, outputs, names) {
        console.log('Connected plugins', names);

        _this._isInitDone = true;
        _this._events.emit(EVENTS.INIT, options, serverOptions);
        _this.server = union.createServer(serverOptions);
        _this._events.emit(EVENTS.INIT_DONE, options, _this);
      });
}

/**
 * exposes Http.listen via Union, check the following URL for parameters and further details:
 * https://nodejs.org/api/net.html#net_server_listen
 */
HttpServer.prototype.listen = function () {
  if (this._isInitDone) {
    this.server.listen.apply(this.server, arguments);
  }
  else {
    var _this = this;
    var _arguments = arguments;
    this._events.once('init:done', function () {
      _this.server.listen.apply(_this.server, _arguments);
    });
  }
};

HttpServer.prototype.close = function () {
  return this.server.close();
};

/*HttpServer.prototype.events = {
  on: this._events.on
};*/

var EVENTS = {
  INIT: 'init',
  INIT_DONE: 'init:done'
};
