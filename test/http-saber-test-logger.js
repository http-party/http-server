var path = require('path');
var request = require('request');
var httpSaber = require('../lib/http-saber');
var assert = require('assert');

var root = path.join(__dirname, 'fixtures', 'root');

describe( 'http-saber', function() {

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
                // done();
            });
            request('http://127.0.0.1:8080/file', function (err, res, body) {
                assert.equal(isCalled, true, 'logger was called');
                logger.callbacks.pop();
                done();
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
