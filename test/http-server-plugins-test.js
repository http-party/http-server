var assert = require('assert'),
    path = require('path'),
    fs = require('fs'),
    vows = require('vows'),
    request = require('request'),
    httpServer = require('../lib/http-server'),
    testPluginSchema = require('../test/http-server-test-plugin/package.json');

var root = path.join(__dirname, 'fixtures', 'root');

vows.describe('http-server-plugins').addBatch({
  'When http-server starts': {
    topic: function () {
      var server = httpServer.createServer({
        root: root,
        pluginDirs: [__dirname + '/']
      });

      var _this = this;
      server.listen({ port: 8100 }, function () {
        _this.callback(null, server);
      });
    },
    'a plugin': {
      topic: function (server) {
        var _this = this;
        console.log(server.plugins);
        this.callback(server, server.plugins);
      },
      'should be registered': function (server, plugins) {
        var pluginName = null;
        for (var key in testPluginSchema.extensions['http-server']) {
          pluginName = key;
          break;
        }

        assert.isTrue(!!plugins[pluginName]);
      }
    }
  }
}).export(module);
