var path = require('path');
var request = require('request');
var httpSaber = require('../lib/http-saber');
var assert = require('assert');

var root = path.join(__dirname, 'fixtures', 'root');

describe( 'http-saber', function() {

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

});
