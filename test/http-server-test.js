var assert = require('assert'),
    path = require('path'),
    fs = require('fs'),
    vows = require('vows'),
    request = require('request'),
    httpServer = require('../lib/http-server');

// Prevent vows from swallowing errors
process.on('uncaughtException', console.error);

var root = path.join(__dirname, 'fixtures', 'root');

// respondsWith makes a request to the URL with the optional opts, and asserts
// the returned response is code with the expected body.
function respondsWith(code, url, opts) {
  var context = {
    topic: function (server) {
      opts = opts || {};
      request(url, opts, this.callback);
    }
  };
  context['status code should be ' + code] = function (err, res) {
    assert.isNull(err);
    assert.equal(res.statusCode, code);
  };
  return context;
}

// respondsWithMessage makes a request to the URL with the optional opts, and asserts
// the returned response is `code` and the response body is `message`.
function respondsWithMessage(code, message, url, opts) {
  var context = respondsWith(code, url, opts);
  context['and file content should be "' + message + '"'] = function (err, res, body) {
    assert.isNull(err);
    assert.equal(body, message);
  };
  return context;
}

// respondsWithFile makes a request to the URL with the optional opts, and asserts
// the returned status is `code` and the response body matches the expected filename
// contents.
function respondsWithFile(code, filename, url, opts) {
  var context = respondsWith(code, url, opts);
  context['and file content'] = {
    topic: function (res, body) {
      var self = this;
      fs.readFile(path.join(root, filename), 'utf8', function (err, data) {
        self.callback(err, data, body);
      });
    },
    'should match content of served file': function (err, data, body) {
      assert.isNull(err);
      assert.equal(data.trim(), body.trim());
    }
  };
  return context;
}

vows.describe('http-server').addBatch({
  'When http-server is listening on 8080,\n': {
    topic: function () {
      var server = httpServer.createServer({
        root: root,
        robots: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true'
        }
      });

      server.listen(8080);
      return server;
    },
    'it should start without errors': function (err, server) {
      assert.isNull(err);
      assert.isTrue(server.server.listening);
    },
    'it should serve files from root directory': respondsWithFile(200, 'file', 'http://127.0.0.1:8080/file'),
    'and a non-existent file is requested...': respondsWith(404, 'http://127.0.0.1:8080/404'),
    'requesting /': {
      topic: function () {
        request('http://127.0.0.1:8080/', this.callback);
      },
      'should respond with index': function (err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.include(body, '/file');
        assert.include(body, '/canYouSeeMe');
      }
    },
    'when robots option is toggled on...': {
      topic: function () {
        request('http://127.0.0.1:8080/robots.txt', this.callback);
      },
      'should respond with status code 200 to /robots.txt': function (err, res) {
        assert.equal(res.statusCode, 200);
      }
    },
    'and options include custom set http-headers...': {
      topic: function () {
        request('http://127.0.0.1:8080/', this.callback);
      },
      'should respond with headers set in options': function (err, res) {
        assert.equal(res.headers['access-control-allow-origin'], '*');
        assert.equal(res.headers['access-control-allow-credentials'], 'true');
      }
    },
    'and the server is set to proxy port 8081 to 8080, ': {
      topic: function () {
        var proxyServer = httpServer.createServer({
          proxy: 'http://127.0.0.1:8080/',
          root: path.join(__dirname, 'fixtures')
        });
        proxyServer.listen(8081);
        return proxyServer;
      },
      'it should start without errors': function (err, server) {
        assert.isNull(err);
        assert.isTrue(server.server.listening);
      },
      '\nit should serve files from the proxy\'s root': respondsWithFile(200, 'file', 'http://127.0.0.1:8081/root/file'),
      '\nit should fallback to the proxied server': respondsWithFile(200, 'file', 'http://127.0.0.1:8081/file'),

      teardown: function (proxyServer) {
        proxyServer.close();
      }
    },
    teardown: function (server) {
      server.close();
    }
  },
  'When CORS is enabled': {
    topic: function () {
      var server = httpServer.createServer({
        root: root,
        cors: true,
        corsHeaders: 'X-Test'
      });
      server.listen(8082);
      return server;
    },
    'it should start without errors': function (err, server) {
      assert.isNull(err);
      assert.isTrue(server.server.listening);
    },
    'and the server is given an OPTIONS request': {
      topic: function () {
        request({
          method: 'OPTIONS',
          uri: 'http://127.0.0.1:8082/',
          headers: {
            'Access-Control-Request-Method': 'GET',
            Origin: 'http://example.com',
            'Access-Control-Request-Headers': 'Foobar'
          }
        }, this.callback);
      },
      'status code should be 204': function (err, res) {
        assert.equal(res.statusCode, 204);
      },
      'response Access-Control-Allow-Headers should contain X-Test': function (err, res) {
        assert.ok(res.headers['access-control-allow-headers'].split(/\s*,\s*/g).indexOf('X-Test') >= 0, 204);
      }
    },
    teardown: function (server) {
      server.close();
    }
  },
  'When gzip and brotli compression is enabled and a compressed file is available': {
    topic: function () {
      var server = httpServer.createServer({
        root: root,
        brotli: true,
        gzip: true
      });
      server.listen(8084);
      return server;
    },
    'it should start without errors': function (err, server) {
      assert.isNull(err);
      assert.isTrue(server.server.listening);
    },
    'and a request accepting only gzip is made': {
      topic: function () {
        request({
          uri: 'http://127.0.0.1:8084/compression/',
          headers: {
            'accept-encoding': 'gzip'
          }
        }, this.callback);
      },
      'response should be gzip compressed': function (err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(res.headers['content-encoding'], 'gzip');
      }
    },
    'and a request accepting only brotli is made': {
      topic: function () {
        request({
          uri: 'http://127.0.0.1:8084/compression/',
          headers: {
            'accept-encoding': 'br'
          }
        }, this.callback);
      },
      'response should be brotli compressed': function (err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(res.headers['content-encoding'], 'br');
      }
    },
    'and a request accepting both brotli and gzip is made': {
      topic: function () {
        request({
          uri: 'http://127.0.0.1:8084/compression/',
          headers: {
            'accept-encoding': 'gzip, br'
          }
        }, this.callback);
      },
      'response should be brotli compressed': function (err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(res.headers['content-encoding'], 'br');
      }
    },
    teardown: function (server) {
      server.close();
    }
  },
  'When http-server is listening on 8083 with username "good_username" and password "good_password"': {
    topic: function () {
      var server = httpServer.createServer({
        root: root,
        robots: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true'
        },
        username: 'good_username',
        password: 'good_password'
      });

      server.listen(8083);
      return server;
    },
    'it should start without errors': function (err, server) {
      assert.isNull(err);
      assert.isTrue(server.server.listening);
    },
    'and the user requests an existent file with no auth details': respondsWithMessage(401, 'Access denied', 'http://127.0.0.1:8083/file'),
    'and the user requests an existent file with incorrect username': respondsWithMessage(401, 'Access denied', 'http://127.0.0.1:8083/file', {
      auth: {
        user: 'wrong_username',
        pass: 'good_password'
      }
    }),
    'and the user requests an existent file with incorrect password': respondsWithMessage(401, 'Access denied', 'http://127.0.0.1:8083/file', {
      auth: {
        user: 'good_username',
        pass: 'wrong_password'
      }
    }),
    'and the user requests a non-existent file with incorrect password': respondsWithMessage(401, 'Access denied', 'http://127.0.0.1:8083/404', {
      auth: {
        user: 'good_username',
        pass: 'wrong_password'
      }
    }),
    'and the user requests an existent file with correct auth details': respondsWithFile(200, 'file', 'http://127.0.0.1:8083/file', {
      auth: {
        user: 'good_username',
        pass: 'good_password'
      }
    }),
    teardown: function (server) {
      server.close();
    }
  },
  'When auto-ext is enabled': {
    topic: function () {
      var server = httpServer.createServer({
        root: root,
        ext: true
      });
      server.listen(8085);
      return server;
    },
    'it should start without errors': function (err, server) {
      assert.isNull(err);
      assert.isTrue(server.server.listening);
    },
    'and a file with no extension is requested with default options,': {
      topic: function () {
        request('http://127.0.0.1:8085/htmlButNot', this.callback);
      },
      'content-type should be text/html': function (res) {
        assert.equal(res.statusCode, 200);
        assert.match(res.headers['content-type'], /^text\/html/);
      }
    },
    teardown: function (server) {
      server.close();
    }
  },
  'When http-server is listening on 8086 with username "good_username" and Number type password 123456': {
    topic: function () {
      var server = httpServer.createServer({
        root: root,
        robots: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true'
        },
        username: 'good_username',
        password: 123456
      });

      server.listen(8086);
      return server;
    },
    'it should start without errors': function (err, server) {
      assert.isNull(err);
      assert.isTrue(server.server.listening);
    },
    'and the user requests an existent file with no auth details': respondsWithMessage(401, 'Access denied', 'http://127.0.0.1:8086/file'),
    'and the user requests an existent file with incorrect username': respondsWithMessage(401, 'Access denied', 'http://127.0.0.1:8083/file', {
      auth: {
        user: 'wrong_username',
        pass: '123456'
      }
    }),
    'and the user requests an existent file with incorrect password': respondsWithMessage(401, 'Access denied', 'http://127.0.0.1:8083/file', {
      auth: {
        user: 'good_username',
        pass: '654321'
      }
    }),
    'and the user requests a non-existent file with incorrect password': respondsWithMessage(401, 'Access denied', 'http://127.0.0.1:8083/404', {
      auth: {
        user: 'good_username',
        pass: '654321'
      }
    }),
    'and the user requests an existent file with correct auth details': respondsWithFile(200, 'file', 'http://127.0.0.1:8086/file', {
      auth: {
        user: 'good_username',
        pass: '123456'
      }
    }),
    teardown: function (server) {
      server.close();
    }
  }
}).export(module);
