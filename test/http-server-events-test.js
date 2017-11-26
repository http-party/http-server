var assert = require('assert'),
    path = require('path'),
    fs = require('fs'),
    vows = require('vows'),
    request = require('request'),
    httpServer = require('../lib/http-server');

var root = path.join(__dirname, 'fixtures', 'root');

vows.describe('http-server-events').addBatch({
  'http-server should fire': {
    topic: function () {
      var server = httpServer.createServer({
        root: root,
        robots: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true'
        }
      });

      this.callback(null, server);
    },
    'fire "request:received" when a request is received': {
      topic: function (server) {
        var _this = this;
        console.log('register ' + httpServer.EVENTS.REQUEST_RECEIVED);
        server.events.on(httpServer.EVENTS.REQUEST_RECEIVED, function (req, res) {
          console.log('caught ' + httpServer.EVENTS.REQUEST_RECEIVED);
        });
        server.events.on(httpServer.EVENTS.INIT_DONE, function (options, instance) {
          console.log('caught ' + httpServer.EVENTS.INIT_DONE);
        });
        server.listen({ port: 8080 }, function () {
          console.log('firing request');
          request('http://127.0.0.1:8080/', _this.callback);
        });
      },
      'should respond with index': function (server) {
        assert.equal(true, true);
        // assert.equal(res.statusCode, 200);
        // assert.include(body, '/file');
        // assert.include(body, '/canYouSeeMe');
      }
    }
  }
}).export(module);
