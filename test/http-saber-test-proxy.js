var path = require('path');
var fs = require('fs');
var request = require('request');
var httpSaber = require('../lib/http-saber');
var assert = require('assert');

var root = path.join(__dirname, 'fixtures', 'root');

describe( 'http-saber', function() {

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

});
