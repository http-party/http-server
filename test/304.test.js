'use strict';

const test = require('tap').test;
const ecstatic = require('../lib/core');
const http = require('http');
const request = require('request');
const path = require('path');
const portfinder = require('portfinder');

const root = `${__dirname}/public`;
const baseDir = 'base';

test('304_not_modified_strong', (t) => {
  portfinder.getPort((err, port) => {
    const file = 'a.txt';

    const server = http.createServer(
      ecstatic({
        root,
        gzip: true,
        baseDir,
        autoIndex: true,
        showDir: true,
        weakEtags: false,
        weakCompare: false,
      })
    );

    server.listen(port, () => {
      const uri = `http://localhost:${port}${path.join('/', baseDir, file)}`;

      request.get({
        uri,
        followRedirect: false,
      }, (err, res) => {
        if (err) {
          t.fail(err);
        }

        t.equal(res.statusCode, 200, 'first request should be a 200');

        request.get({
          uri,
          followRedirect: false,
          headers: { 'if-modified-since': res.headers['last-modified'] },
        }, (err2, res2) => {
          if (err2) {
            t.fail(err2);
          }

          t.equal(res2.statusCode, 304, 'second request should be a 304');
          t.equal(res2.headers.etag.indexOf('"'), 0, 'should return a strong etag');
          server.close();
          t.end();
        });
      });
    });
  });
});

test('304_not_modified_weak', (t) => {
  portfinder.getPort((err, port) => {
    const file = 'b.txt';

    const server = http.createServer(
      ecstatic({
        root,
        gzip: true,
        baseDir,
        autoIndex: true,
        showDir: true,
        weakCompare: false,
      })
    );

    server.listen(port, () => {
      const uri = `http://localhost:${port}${path.join('/', baseDir, file)}`;
      const now = (new Date()).toString();

      request.get({
        uri,
        followRedirect: false,
      }, (err, res) => {
        if (err) {
          t.fail(err);
        }

        t.equal(res.statusCode, 200, 'first request should be a 200');

        request.get({
          uri,
          followRedirect: false,
          headers: { 'if-modified-since': now },
        }, (err2, res2) => {
          if (err2) t.fail(err2);

          t.equal(res2.statusCode, 304, 'second request should be a 304');
          t.equal(res2.headers.etag.indexOf('W/'), 0, 'should return a weak etag');
          server.close();
          t.end();
        });
      });
    });
  });
});

test('304_not_modified_strong_compare', (t) => {
  portfinder.getPort((err, port) => {
    const file = 'b.txt';

    const server = http.createServer(
      ecstatic({
        root,
        gzip: true,
        baseDir,
        autoIndex: true,
        showDir: true,
        weakEtags: false,
        weakCompare: false,
      })
    );

    server.listen(port, () => {
      const uri = `http://localhost:${port}${path.join('/', baseDir, file)}`;
      const now = (new Date()).toString();
      let etag = null;

      request.get({
        uri,
        followRedirect: false,
      }, (err, res) => {
        if (err) {
          t.fail(err);
        }

        t.equal(res.statusCode, 200, 'first request should be a 200');

        etag = res.headers.etag;

        request.get({
          uri,
          followRedirect: false,
          headers: { 'if-modified-since': now, 'if-none-match': etag },
        }, (err2, res2) => {
          if (err2) {
            t.fail(err2);
          }

          t.equal(res2.statusCode, 304, 'second request with a strong etag should be 304');

          request.get({
            uri,
            followRedirect: false,
            headers: { 'if-modified-since': now, 'if-none-match': `W/${etag}` },
          }, (err3, res3) => {
            if (err3) {
              t.fail(err3);
            }

            // Note that if both if-modified-since and if-none-match are
            // provided, the server MUST NOT return a response status of 304
            // unless doing so is consistent with all of the conditional
            // header fields in the request
            // https://www.ietf.org/rfc/rfc2616.txt
            t.equal(res3.statusCode, 200, 'third request with a weak etag should be 200');
            server.close();
            t.end();
          });
        });
      });
    });
  });
});


test('304_not_modified_weak_compare', (t) => {
  portfinder.getPort((err, port) => {
    const file = 'c.js';

    const server = http.createServer(
      ecstatic({
        root,
        gzip: true,
        baseDir,
        autoIndex: true,
        showDir: true,
        weakEtags: false,
      })
    );

    server.listen(port, () => {
      const uri = `http://localhost:${port}${path.join('/', baseDir, file)}`;
      const now = (new Date()).toString();
      let etag = null;

      request.get({
        uri,
        followRedirect: false,
      }, (err, res) => {
        if (err) {
          t.fail(err);
        }

        t.equal(res.statusCode, 200, 'first request should be a 200');

        etag = res.headers.etag;

        request.get({
          uri,
          followRedirect: false,
          headers: { 'if-modified-since': now, 'if-none-match': etag },
        }, (err2, res2) => {
          if (err2) {
            t.fail(err2);
          }

          t.equal(res2.statusCode, 304, 'second request with a strong etag should be 304');

          request.get({
            uri,
            followRedirect: false,
            headers: { 'if-modified-since': now, 'if-none-match': `W/${etag}` },
          }, (err3, res3) => {
            if (err3) {
              t.fail(err3);
            }

            t.equal(res3.statusCode, 304, 'third request with a weak etag should be 304');
            server.close();
            t.end();
          });
        });
      });
    });
  });
});
