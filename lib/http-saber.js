'use strict';

var fs = require('fs'),
    union = require('union'),
    ecstatic = require('ecstatic'),
    httpProxy = require('http-proxy'),
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

  this.plugins = {};
  var pluginDirs = options.pluginDirs || [];

  // make sure our own plugins are at the top
  pluginDirs.unshift(__dirname + '/plugins/');

  var before = options.before ? options.before.slice() : [];

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
    headers: this.headers
  };

  if (options.https) {
    serverOptions.https = options.https;
  }

  this.server = null; // will be populated after init

  this._events = this.events = new EventEmitter();
  serverOptions.before.unshift(function onRequestReceived(req, res) {
    _this.events.emit(EVENTS.REQUEST_RECEIVED, req, res, { instance: _this });
    res.emit('next');
  });

  // hook up plugins
  var host = {
    events: this._events
  };
  pluginManager.scanSubdirs(pluginDirs); // scan pre-defined dirs
  pluginManager.scan(); // scan all dependencies
  pluginManager.connect(host, 'http-saber', { multi: true, data: null },
      function (err, outputs, names) {
        names.forEach(function (pluginName) {
          console.log('connected plugin: ', pluginName);

          // TODO: will add mode metadata to the plugin entry
          // TODO: add plugin dir location
          _this.plugins[pluginName] = {};
        });

        // internal init is done
        _this._isInitDone = true;
        // notify listeners that init phase started
        _this._events.emit(EVENTS.INIT, options, serverOptions, _this);

        _this.server = union.createServer(serverOptions);

        // notify listeners that init phase is done
        _this._events.emit(EVENTS.INIT_DONE, options, serverOptions, _this);
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
    var _arguments = arguments;
    this._events.once(EVENTS.INIT_DONE, function (options, unionOptions, instance) {
      instance.server.listen.apply(instance.server, _arguments);
    });
  }
};

HttpServer.prototype.close = function () {
  return this.server.close();
};

var EVENTS = {
  INIT: 'init',
  INIT_DONE: 'init:done',
  REQUEST_RECEIVED: 'request:received'
};

/**
 * All supported events that can be subscribed to
 */
exports.EVENTS = EVENTS;
