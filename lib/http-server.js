var fs = require('fs'),
    union = require('union'),
    ecstatic = require('ecstatic'),
    HTTPServer;

HTTPServer = exports.HTTPServer = function (options) {
  if (!options) {
    options = {};
  }

  if (!options.headers) {
    options.headers = {};
  }

  this.root = options.root || (this.checkDirExistence('./public') ? './public' : './');
  this.ext = options.ext === true ? 'html' : options.ext;
  this.autoIndex = options.autoIndex !== 'false';
  this.showDir = options.showDir !== 'false';
  this.cache = options.cache || 3600;  // in seconds.
  this.https = options.https || false;
  this.headers = options.headers;
  this.before = options.before || [];
  this.logFn = options.logFn;

  this.server = this.create();
};

HTTPServer.prototype.create = function () {
  var self = this,
      serverOptions;

  serverOptions = {
    before: (this.before).concat([
      function (req, res) {
        if (self.logFn) {
          self.logFn(req, res);
        }

        res.emit('next');
      },
      ecstatic({
        defaultExt: this.ext,
        autoIndex: this.autoIndex,
        showDir: this.showDir,
        cache: this.cache,
        root: this.root
      })
    ]),
        headers: this.headers,
      https: this.https
  };

  return union.createServer(serverOptions);
};

HTTPServer.prototype.checkDirExistence = function (dir) {
  var bExistFlag = true;

  try {
    fs.lstatSync(dir);
  }
  catch (er) {
    bExistFlag = false;
  }

  return bExistFlag;
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
