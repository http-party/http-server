

var static = require('../vendor/node-static/lib/node-static'),
    http = require('http');

var HTTPServer = exports.HTTPServer = function (options) {
  for (var o in options) {
    this[o] = options[o];
  }
  this.file = new(static.Server)(this.root, { AutoIndex: this.AutoIndex, cache: Number(this.cache) });
}
  
HTTPServer.prototype.start = function () {
  var self = this;
  self.log('Starting up http-server, serving '.yellow 
            + self.root.cyan 
            + ' on port: '.yellow 
            + self.port.toString().cyan);
  http.createServer(function(request, response) {
    request.on('end', function() {
      self.log('['.grey+'served'.yellow+'] '.grey + request.url);
      return self.file.serve(request, response);
    });
  }).listen(self.port, self.host);
  self.log('http-server successfully started: '.green 
            + 'http://'.cyan 
            + self.host.cyan 
            + ':'.cyan 
            + self.port.toString().cyan);
  self.log('Hit CTRL-C to stop the server')
}

HTTPServer.prototype.log = function (message) {
  if (!this.silent) {
    console.log(message);
  }
}
