var assert = require('assert'),
    path = require('path'),
    fs = require('fs'),
    vows = require('vows'),
    request = require('request'),
    httpServer = require('../lib/http-saber'),
    testplugin = require('./http-saber-test-plugin/plugin'),
    testPluginSchema = require('./http-saber-test-plugin/package.json');

var root = path.join(__dirname, 'fixtures', 'root');

vows.describe('http-saber-plugins').addBatch({
  'When http-saber starts': {
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
        this.callback(server, server.plugins);
      },
      'should be found and registered': function (server, plugins) {
        var pluginName = null;
        for (var key in testPluginSchema.extensions['http-saber']) {
          pluginName = key;
          break;
        }

        assert.isTrue(!!plugins[pluginName]);
      }
    }
  },
  'When our test plugin is registered': {
    topic: function () {
      // tracks responses from our callbacks
      var callbackResponses = {};
      callbackResponses[httpServer.EVENTS.INIT] = null;
      callbackResponses[httpServer.EVENTS.INIT_DONE] = null;
      callbackResponses[httpServer.EVENTS.REQUEST_RECEIVED] = null;

      testplugin.onInitCallback = function (options, unionOptions) {
        callbackResponses[httpServer.EVENTS.INIT] = true;
      };
      testplugin.onInitDoneCallback = function (options, unionOptions) {
        callbackResponses[httpServer.EVENTS.INIT_DONE] = true;
      };
      testplugin.onRequestCallback = function (req, res) {
        callbackResponses[httpServer.EVENTS.REQUEST_RECEIVED] = true;
      };

      this.callback(null, callbackResponses);
    },
    'a callback should be called': {
      topic: function (pluginCBResponses) {
        var server = httpServer.createServer({
          root: root,
          pluginDirs: [__dirname + '/']
        });

        var _this = this;
        server.listen({ port: 8101 }, function () {
          _this.callback(null, pluginCBResponses);
        });
      },
      'on init': function (responses) {
        assert.isTrue(responses[httpServer.EVENTS.INIT]);
      },
      'on init_done': function (responses) {
        assert.isTrue(responses[httpServer.EVENTS.INIT_DONE]);
      },
      'on request': function (responses) {
        request('http://127.0.0.1:8101/', function () {
          assert.isTrue(responses[httpServer.EVENTS.REQUEST_RECEIVED]);
        });
      }
    }
  }
}).export(module);
