var path = require('path');
var request = require('request');
var httpSaber = require('../lib/http-saber');
var assert = require('assert');

var root = path.join(__dirname, 'fixtures', 'root');

describe( 'http-saber', function() {

    // TODO: move to cors plugin
    describe( 'When cors is enabled', function(done) {

        var TEST_HEADER = 'X-Test';
        var server = null;
        before( function() {
            server = httpSaber.createServer({
                root: root,
                cors: true,
                corsHeaders: TEST_HEADER
            });
            return new Promise( function( resolve, reject ) {
                server.listen(8080, resolve);
            });
        });

        beforeEach(function() {});
        afterEach(function() {});

        after(function() {
            server.close();
        });

        describe('and given OPTIONS request', function(done) {

            it('should respond with status code 204', function(done) {
                request({
                    method: 'OPTIONS',
                    uri: 'http://127.0.0.1:8080/',
                    headers: {
                        'Access-Control-Request-Method': 'GET',
                        'Origin': 'http://example.com',
                        'Access-Control-Request-Headers': 'Foobar'
                    }
                }, function (err, res, body) {
                    assert.equal(res.statusCode, 204);
                    assert.ok(res.headers['access-control-allow-headers'].split(/\s*,\s*/g).indexOf( TEST_HEADER ) >= 0, 204);
                    done();
                });
            });

            it('CORS headers should be present', function(done) {
                request({
                    method: 'OPTIONS',
                    uri: 'http://127.0.0.1:8080/',
                    headers: {
                        'Access-Control-Request-Method': 'GET',
                        'Origin': 'http://example.com',
                        'Access-Control-Request-Headers': 'Foobar'
                    }
                }, function (err, res, body) {

                    // FIXME: loop through all headers and compare request to response headers

                    assert.ok(res.headers['access-control-allow-headers'].split(/\s*,\s*/g).indexOf( TEST_HEADER ) >= 0, 204);
                    done();
                });
            });

        });

    });

});
