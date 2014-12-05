var ecstatic = require('ecstatic'),
    union = require('union'),
    fs = require('fs');

var HTTPServer = exports.HTTPServer = function (options) {
  this.init.apply(this, arguments);
};

HTTPServer.prototype.init = function(options){
  this.create(options || {});
};

HTTPServer.prototype.checkDirExistence = function(dir) {
  try { fs.lstatSync(dir); return true }
  catch (er) { return false }
};

HTTPServer.prototype.getRootDir = function(){
  return this.root;
};

HTTPServer.prototype.create = function (options){
  this.root = options.root || (this.checkDirExistence('./public') ? './public' : './');

  var ecsOptions = {
    defaultExt : options.ext === true ? 'html' : options.ext,
    autoIndex : options.autoIndex !== 'false',
    showDir : options.showDir !== 'false',
    cache : options.cache || 3600,  // in seconds.
    root : this.root
  };

  var wrapLogFn = function (req, res) {
    options.logFn && options.logFn(req, res);
    res.emit('next');
  };

  var serverOptions = {
    before : (options.before || []).concat([
      wrapLogFn,
      ecstatic(ecsOptions)
    ]),
    headers : options.headers || {},
    https : options.https || false
  };

  this.server = union.createServer(serverOptions);
};

HTTPServer.prototype.listen = function() {
  this.server.listen.apply(this.server, arguments);
};

HTTPServer.prototype.close = function () {
  return this.server.close();
};

exports.createServer = function (options) {
  return new HTTPServer(options);
};
