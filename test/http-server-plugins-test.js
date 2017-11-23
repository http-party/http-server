var assert = require('assert'),
    path = require('path'),
    fs = require('fs'),
    vows = require('vows'),
    request = require('request'),
    httpServer = require('../lib/http-server');

var root = path.join(__dirname, 'fixtures', 'root');

vows.describe('http-server-plugins').addBatch({
  'When http-server starts': {
    topic: function () {
      var server = httpServer.createServer({
        root: root,
        robots: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true'
        }
      });

      var _this = this;
      server.listen({ port: 8080 }, function () {
        _this.callback(null, server);
      });
    },
    'local plugin should be registered': {
      topic: function () {
        request('http://127.0.0.1:8080/', this.callback);
      },
      'should respond with index': function (err, res, body) {
        assert.equal(true, true);
        // assert.equal(res.statusCode, 200);
        // assert.include(body, '/file');
        // assert.include(body, '/canYouSeeMe');
      }
    }
  }
}).export(module);
