var path = require('path');
var fs = require('fs');
var request = require('request');
var httpSaber = require('../lib/http-saber');
var assert = require('assert');
var chai = require('chai');

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
                chai.assert.include(body, '/file');
                chai.assert.include(body, '/canYouSeeMe');
                done();
            });
        });

    });

});
