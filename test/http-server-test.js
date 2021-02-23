var assert = require('assert'),
    path = require('path'),
    fs = require('fs'),
    vows = require('vows'),
    request = require('request'),
    httpServer = require('../lib/http-server');

// Prevent vows from swallowing errors
process.on('uncaughtException', console.error);

var root = path.join(__dirname, 'fixtures', 'root');

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
      this.callback(null, server);
    },
    'it should serve files from root directory': {
      topic: function () {
        request('http://127.0.0.1:8080/file', this.callback);
      },
      'status code should be 200': function (res) {
        assert.equal(res.statusCode, 200);
      },
      'and file content': {
        topic: function (res, body) {
          var self = this;
          fs.readFile(path.join(root, 'file'), 'utf8', function (err, data) {
            self.callback(err, data, body);
          });
        },
        'should match content of served file': function (err, file, body) {
          assert.equal(body.trim(), file.trim());
        }
      }
    },
    'and a non-existent file is requested...': {
      topic: function () {
        request('http://127.0.0.1:8080/404', this.callback);
      },
      'status code should be 404': function (res) {
        assert.equal(res.statusCode, 404);
      }
    },
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
      'should respond with status code 200 to /robots.txt': function (res) {
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
        this.callback(null, proxyServer);
      },
      '\nit should serve files from the proxy\'s root': {
        topic: function () {
          request('http://127.0.0.1:8081/root/file', this.callback);
        },
        'status code should be the endpoint code 200': function (res) {
          assert.equal(res.statusCode, 200);
        },
        'and file content': {
          topic: function (res, body) {
            var self = this;
            fs.readFile(path.join(root, 'file'), 'utf8', function (err, data) {
              self.callback(err, data, body);
            });
          },
          'should match content of the served file': function (err, file, body) {
            assert.equal(body.trim(), file.trim());
          }
        }
      },
      '\nit should fallback to the proxied server': {
        topic: function () {
          request('http://127.0.0.1:8081/file', this.callback);
        },
        'status code should be the endpoint code 200': function (res) {
          assert.equal(res.statusCode, 200);
        },
        'and file content': {
          topic: function (res, body) {
            var self = this;
            fs.readFile(path.join(root, 'file'), 'utf8', function (err, data) {
              self.callback(err, data, body);
            });
          },
          'should match content of the proxied served file': function (err, file, body) {
            assert.equal(body.trim(), file.trim());
          }
        }
      },
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
      this.callback(null, server);
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
      this.callback(null, server);
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
      this.callback(null, server);
    },
    'and the user requests an existent file with no auth details': {
      topic: function () {
        request('http://127.0.0.1:8083/file', this.callback);
      },
      'status code should be 401': function (res) {
        assert.equal(res.statusCode, 401);
      },
      'and file content': {
        topic: function (res, body) {
          var self = this;
          fs.readFile(path.join(root, 'file'), 'utf8', function (err, data) {
            self.callback(err, data, body);
          });
        },
        'should be a forbidden message': function (err, file, body) {
          assert.equal(body, 'Access denied');
        }
      }
    },
    'and the user requests an existent file with incorrect username': {
      topic: function () {
        request('http://127.0.0.1:8083/file', {
          auth: {
            user: 'wrong_username',
            pass: 'good_password'
          }
        }, this.callback);
      },
      'status code should be 401': function (res) {
        assert.equal(res.statusCode, 401);
      },
      'and file content': {
        topic: function (res, body) {
          var self = this;
          fs.readFile(path.join(root, 'file'), 'utf8', function (err, data) {
            self.callback(err, data, body);
          });
        },
        'should be a forbidden message': function (err, file, body) {
          assert.equal(body, 'Access denied');
        }
      }
    },
    'and the user requests an existent file with incorrect password': {
      topic: function () {
        request('http://127.0.0.1:8083/file', {
          auth: {
            user: 'good_username',
            pass: 'wrong_password'
          }
        }, this.callback);
      },
      'status code should be 401': function (res) {
        assert.equal(res.statusCode, 401);
      },
      'and file content': {
        topic: function (res, body) {
          var self = this;
          fs.readFile(path.join(root, 'file'), 'utf8', function (err, data) {
            self.callback(err, data, body);
          });
        },
        'should be a forbidden message': function (err, file, body) {
          assert.equal(body, 'Access denied');
        }
      }
    },
    'and the user requests a non-existent file with incorrect password': {
      topic: function () {
        request('http://127.0.0.1:8083/404', {
          auth: {
            user: 'good_username',
            pass: 'wrong_password'
          }
        }, this.callback);
      },
      'status code should be 401': function (res) {
        assert.equal(res.statusCode, 401);
      },
      'and file content': {
        topic: function (res, body) {
          var self = this;
          fs.readFile(path.join(root, 'file'), 'utf8', function (err, data) {
            self.callback(err, data, body);
          });
        },
        'should be a forbidden message': function (err, file, body) {
          assert.equal(body, 'Access denied');
        }
      }
    },
    'and the user requests an existent file with correct auth details': {
      topic: function () {
        request('http://127.0.0.1:8083/file', {
          auth: {
            user: 'good_username',
            pass: 'good_password'
          }
        }, this.callback);
      },
      'status code should be 200': function (res) {
        assert.equal(res.statusCode, 200);
      },
      'and file content': {
        topic: function (res, body) {
          var self = this;
          fs.readFile(path.join(root, 'file'), 'utf8', function (err, data) {
            self.callback(err, data, body);
          });
        },
        'should match content of served file': function (err, file, body) {
          assert.equal(body.trim(), file.trim());
        }
      }
    },
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
      this.callback(null, server);
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
      this.callback(null, server);
    },
    'and the user requests an existent file with no auth details': {
      topic: function () {
        request('http://127.0.0.1:8086/file', this.callback);
      },
      'status code should be 401': function (res) {
        assert.equal(res.statusCode, 401);
      },
      'and file content': {
        topic: function (res, body) {
          var self = this;
          fs.readFile(path.join(root, 'file'), 'utf8', function (err, data) {
            self.callback(err, data, body);
          });
        },
        'should be a forbidden message': function (err, file, body) {
          assert.equal(body, 'Access denied');
        }
      }
    },
    'and the user requests an existent file with incorrect username': {
      topic: function () {
        request('http://127.0.0.1:8086/file', {
          auth: {
            user: 'wrong_username',
            pass: '123456'
          }
        }, this.callback);
      },
      'status code should be 401': function (res) {
        assert.equal(res.statusCode, 401);
      },
      'and file content': {
        topic: function (res, body) {
          var self = this;
          fs.readFile(path.join(root, 'file'), 'utf8', function (err, data) {
            self.callback(err, data, body);
          });
        },
        'should be a forbidden message': function (err, file, body) {
          assert.equal(body, 'Access denied');
        }
      }
    },
    'and the user requests an existent file with incorrect password': {
      topic: function () {
        request('http://127.0.0.1:8086/file', {
          auth: {
            user: 'good_username',
            pass: '654321'
          }
        }, this.callback);
      },
      'status code should be 401': function (res) {
        assert.equal(res.statusCode, 401);
      },
      'and file content': {
        topic: function (res, body) {
          var self = this;
          fs.readFile(path.join(root, 'file'), 'utf8', function (err, data) {
            self.callback(err, data, body);
          });
        },
        'should be a forbidden message': function (err, file, body) {
          assert.equal(body, 'Access denied');
        }
      }
    },
    'and the user requests a non-existent file with incorrect password': {
      topic: function () {
        request('http://127.0.0.1:8086/404', {
          auth: {
            user: 'good_username',
            pass: '654321'
          }
        }, this.callback);
      },
      'status code should be 401': function (res) {
        assert.equal(res.statusCode, 401);
      },
      'and file content': {
        topic: function (res, body) {
          var self = this;
          fs.readFile(path.join(root, 'file'), 'utf8', function (err, data) {
            self.callback(err, data, body);
          });
        },
        'should be a forbidden message': function (err, file, body) {
          assert.equal(body, 'Access denied');
        }
      }
    },
    'and the user requests an existent file with correct auth details': {
      topic: function () {
        request('http://127.0.0.1:8086/file', {
          auth: {
            user: 'good_username',
            pass: '123456'
          }
        }, this.callback);
      },
      'status code should be 200': function (res) {
        assert.equal(res.statusCode, 200);
      },
      'and file content': {
        topic: function (res, body) {
          var self = this;
          fs.readFile(path.join(root, 'file'), 'utf8', function (err, data) {
            self.callback(err, data, body);
          });
        },
        'should match content of served file': function (err, file, body) {
          assert.equal(body.trim(), file.trim());
        }
      }
    },
    teardown: function (server) {
      server.close();
    }
  }
}).export(module);
