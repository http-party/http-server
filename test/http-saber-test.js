var assert = require('assert');
var path = require('path');
var fs = require('fs');
var vows = require('vows');
var request = require('request');
var httpSaber = require('../lib/http-saber');
var chai = require('chai');
var assert = require('assert');
var expect = require('chai').expect;
var should = require('chai').should();

var root = path.join(__dirname, 'fixtures', 'root');

describe( 'http-saber', function() {

    describe( 'When http-saber is listening on 8080', function(done) {

        var server = null;
        before( function() {
           server = httpSaber.createServer({
               root: root
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

        it('it should serve files from root directory', function(done) {
            request('http://127.0.0.1:8080/file', function (err, res, body) {
                assert.equal( res.statusCode, 200, 'status code should be 200' );
                done();
            });
        });

        it('file content should match content of served file', function(done) {
            request('http://127.0.0.1:8080/file', function (err, res, body) {
                assert.equal( res.statusCode, 200, 'status code should be 200' );

                fs.readFile(path.join(root, 'file'), 'utf8', function (err, file) {
                    assert.equal(body.trim(), file.trim(), 'file content should match content of served file');
                    done();
                });
            });
        });

        it('non-existent file should result in 404', function(done) {
            request('http://127.0.0.1:8080/494', function (err, res, body) {
                assert.equal( res.statusCode, 404, 'status code should be 404' );
                done();
            });
        });

        it('requesting / should respond with index', function(done) {
            request('http://127.0.0.1:8080/', function (err, res, body) {
                assert.equal(res.statusCode, 200);
                assert.include(body, '/file');
                assert.include(body, '/canYouSeeMe');
                done();
            });
        });

    });

    // TODO: move to robots plugin
    describe( 'When robots options is activated', function(done) {

        var server = null;
        before( function() {
            server = httpSaber.createServer({
                root: root,
                robots: true,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': 'true'
                }
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

        it('should respond with status code 200 to /robots.txt', function(done) {
            request('http://127.0.0.1:8080/', function (err, res, body) {
                assert.equal(res.statusCode, 200);
                done();
            });
        });

        it('should respond with headers set via options', function(done) {
            request('http://127.0.0.1:8080/robots.txt', function (err, res, body) {
                assert.equal(res.headers['access-control-allow-origin'], '*');
                assert.equal(res.headers['access-control-allow-credentials'], 'true');
                done();
            });
        });

    });

    // TODO: move to proxy plugin?
    describe( 'When http-saber is proxying from 8081 to 8080', function(done) {

        var server = null;
        var proxy = null;
        before( function() {
            server = httpSaber.createServer({
                root: root
            });
            proxy = httpSaber.createServer({
                root: path.join(__dirname, 'fixtures'),
                proxy: 'http://127.0.0.1:8080/'
            });

            return Promise.all([
                new Promise( function( resolve, reject ) {
                    server.listen(8080, resolve);
                }),
                new Promise( function( resolve, reject ) {
                    proxy.listen(8081, resolve);
                })
            ]);
        });

        beforeEach(function() {});
        afterEach(function() {});

        after(function() {
            server.close();
            proxy.close();
        });

        it('it should serve files from the proxy server root directory', function(done) {
            request('http://127.0.0.1:8081/root/file', function (err, res, body) {
                assert.equal(res.statusCode, 200, 'status code should be the endpoint code 200');
                done();
            });
        });

        it('file content should match content of served file', function(done) {
            request('http://127.0.0.1:8081/root/file', function (err, res, body) {
                assert.equal( res.statusCode, 200, 'status code should be 200' );

                fs.readFile(path.join(root, 'file'), 'utf8', function (err, file) {
                    assert.equal(body.trim(), file.trim(), 'file content should match content of served file');
                    done();
                });
            });
        });

        it('it should fallback to the proxied server', function(done) {
            request('http://127.0.0.1:8081/file', function (err, res, body) {
                assert.equal(res.statusCode, 200, 'status code should be the endpoint code 200');

                fs.readFile(path.join(root, 'file'), 'utf8', function (err, file) {
                    assert.equal(body.trim(), file.trim(), 'file content should match content of served file');
                    done();
                });
            });
        });

    });

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

    // TODO: move to logger plugin
    describe( 'When logger is given', function(done) {

        function Logger() {
            var _this = this;
            this.log = function ( req, res, error ) {
                _this.callbacks.forEach(function( cb ) {
                    cb( req, res, error );
                });
            };
            this.messages = [];
            this.callbacks = [];
        }
        var logger = new Logger();
        var server = null;

        before(function() {
            server = httpSaber.createServer({
                root: root,
                logFn: logger.log
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

        it('it should be called', function(done) {
            var isCalled = false;
            logger.callbacks.push(function() {
                isCalled = true;
                done();
            });
            request('http://127.0.0.1:8080/file', function (err, res, body) {
                assert.equal(isCalled, true, 'logger was called');
                logger.callbacks.pop();
                // done();
            });
        });

        it('on a bad request an error should be passed', function(done) {
            var isError = false;
            logger.callbacks.push(function (req, res, error) {
                // this will be called twice
                // once on request, and once on response
                isError = !!error;
            });
            request({
                method: 'DELETE',
                uri: 'http://127.0.0.1:8080/foo'
            }, function() {
                assert.equal(isError, true, 'error');
                logger.callbacks.pop();
                done();
            });
        });

    });

});
