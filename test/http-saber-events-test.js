var path = require('path');
var request = require('request');
var httpSaber = require('../lib/http-saber');
var chai = require('chai');
var assert = require('assert');
var expect = require('chai').expect;
var should = require('chai').should();


var root = path.join(__dirname, 'fixtures', 'root');

describe('http-saber-events', function () {

    describe('http-saber should fire', function () {

        var server = null;
        before(function () {
            server = httpSaber.createServer({});
            return new Promise(function (resolve, reject) {
                server.listen(8080, resolve);
            });
        });

        after(function () {
            server.close();
        });

        it('request:received', function (done) {
            var isEventRecieved = false;
            server.events.on(httpSaber.EVENTS.REQUEST_RECEIVED, function (req, res) {
                console.log('caught ' + httpSaber.EVENTS.REQUEST_RECEIVED);
                isEventRecieved = true;
            });

            request('http://127.0.0.1:8080/', function () {
                assert.equal(true, isEventRecieved);
                done();
            });
        });
    });
});
