'use strict';

const test = require('tap').test;
const ecstatic = require('../lib/core');
const http = require('http');
const request = require('request');

const root = `${__dirname}/public`;

test('--force-content-encoding flag: .br files served without Content-Encoding header when flag not set', (t) => {
  t.plan(3);

  const server = http.createServer(ecstatic({
    root,
    brotli: true,
    autoIndex: true,
    forceContentEncoding: false
  }));

  server.listen(() => {
    const port = server.address().port;
    const options = {
      uri: `http://localhost:${port}/brotli/index.html.br`,
      headers: {
        'accept-encoding': 'gzip, deflate, br'
      }
    };

    request.get(options, (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 200);
      t.notOk(res.headers['content-encoding'], 'should not have content-encoding header when flag not set');
    });
  });

  t.once('end', () => {
    server.close();
  });
});

test('--force-content-encoding flag: .br files served with Content-Encoding header when flag is set', (t) => {
  t.plan(3);

  const server = http.createServer(ecstatic({
    root,
    brotli: true,
    autoIndex: true,
    forceContentEncoding: true
  }));

  server.listen(() => {
    const port = server.address().port;
    const options = {
      uri: `http://localhost:${port}/brotli/index.html.br`,
      headers: {
        'accept-encoding': 'gzip, deflate, br'
      }
    };

    request.get(options, (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 200);
      t.equal(res.headers['content-encoding'], 'br', 'should have content-encoding: br header when flag is set');
    });
  });

  t.once('end', () => {
    server.close();
  });
});

test('--force-content-encoding flag: regular files served with Content-Encoding header when flag is set', (t) => {
  t.plan(3);

  const server = http.createServer(ecstatic({
    root,
    brotli: true,
    autoIndex: true,
    forceContentEncoding: true
  }));

  server.listen(() => {
    const port = server.address().port;
    const options = {
      uri: `http://localhost:${port}/brotli/index.html`,
      headers: {
        'accept-encoding': 'gzip, deflate, br'
      }
    };

    request.get(options, (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 200);
      t.ok(res.headers['content-encoding'], 'regular files should have content-encoding header');
    });
  });

  t.once('end', () => {
    server.close();
  });
});
