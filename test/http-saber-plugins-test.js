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
var testplugin = require('./http-saber-test-plugin/plugin');
var testPluginSchema = require('./http-saber-test-plugin/package.json');

var root = path.join(__dirname, 'fixtures', 'root');

describe( 'http-saber-plugins', function() {

    describe( 'When http-saber starts', function(done) {

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

        it('a plugin should be found', function(done) {
            var pluginName = null;
            for (var key in testPluginSchema.extensions['http-saber']) {
                pluginName = key;
                break;
            }

            assert.isTrue( !!server.plugins[ pluginName ] );
            done();
        });

    });
    
    describe( 'When our test plugin is registered', function(done) {

        // tracks responses from our callbacks
        var callbackResponses = {};
        callbackResponses[httpSaber.EVENTS.INIT] = null;
        callbackResponses[httpSaber.EVENTS.INIT_DONE] = null;
        callbackResponses[httpSaber.EVENTS.REQUEST_RECEIVED] = null;
      
        var server = null;
        before( function() {
            testplugin.onInitCallback = function (options, unionOptions) {
                callbackResponses[httpSaber.EVENTS.INIT] = true;
            };
            testplugin.onInitDoneCallback = function (options, unionOptions) {
                callbackResponses[httpSaber.EVENTS.INIT_DONE] = true;
            };
            testplugin.onRequestCallback = function (req, res) {
                callbackResponses[httpSaber.EVENTS.REQUEST_RECEIVED] = true;
            };
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

        it('a callback should be called', function(done) {
            request('http://127.0.0.1:8080/file', function (err, res, body) {
                assert.equal( res.statusCode, 200, 'status code should be 200' );

                fs.readFile(path.join(root, 'file'), 'utf8', function (err, file) {
                    assert.equal(body.trim(), file.trim(), 'file content should match content of served file');
                    done();
                });
            });
        });

        it('on init', function (done) {
            assert.isTrue(callbackResponses[httpSaber.EVENTS.INIT]);
            done();
        });
        it('on init_done', function (done) {
            assert.isTrue(callbackResponses[httpSaber.EVENTS.INIT_DONE]);
            done();
        });
        it('on request', function (done) {
            request('http://127.0.0.1:8080/', function () {
                assert.isTrue(callbackResponses[httpSaber.EVENTS.REQUEST_RECEIVED]);
                done();
            });
        });

    });

});
