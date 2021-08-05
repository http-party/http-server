'use strict';

const test = require('tap').test;
const ecstatic = require('../lib/core');
const http = require('http');
const request = require('request');

const root = `${__dirname}/public`;

test('serves brotli-encoded file when available', (t) => {
  t.plan(3);

  const server = http.createServer(ecstatic({
    root,
    brotli: true,
    autoIndex: true
  }));

  server.listen(() => {
    const port = server.address().port;
    const options = {
      uri: `http://localhost:${port}/brotli`,
      headers: {
        'accept-encoding': 'gzip, deflate, br'
      }
    };

    request.get(options, (err, res) => {
      t.ifError(err);
      t.equal(res.statusCode, 200);
      t.equal(res.headers['content-encoding'], 'br');
    });
  });
  t.once('end', () => {
    server.close();
  });
});

test('serves gzip-encoded file when brotli not available', (t) => {
  t.plan(3);

  const server = http.createServer(ecstatic({
    root,
    brotli: true,
    gzip: true,
    autoIndex: true
  }));

  server.listen(() => {
    const port = server.address().port;
    const options = {
      uri: `http://localhost:${port}/gzip`,
      headers: {
        'accept-encoding': 'gzip, deflate, br'
      }
    };

    request.get(options, (err, res) => {
      t.ifError(err);
      t.equal(res.statusCode, 200);
      t.equal(res.headers['content-encoding'], 'gzip');
    });
  });
  t.once('end', () => {
    server.close();
  });
});

test('serves gzip-encoded file when brotli not accepted', (t) => {
  t.plan(3);

  const server = http.createServer(ecstatic({
    root,
    brotli: true,
    gzip: true,
    autoIndex: true
  }));

  server.listen(() => {
    const port = server.address().port;
    const options = {
      uri: `http://localhost:${port}/brotli`,
      headers: {
        'accept-encoding': 'gzip, deflate'
      }
    };

    request.get(options, (err, res) => {
      t.ifError(err);
      t.equal(res.statusCode, 200);
      t.equal(res.headers['content-encoding'], 'gzip');
    });
  });
  t.once('end', () => {
    server.close();
  });
});

test('serves gzip-encoded file when brotli not enabled', (t) => {
  t.plan(3);

  const server = http.createServer(ecstatic({
    root,
    brotli: false,
    gzip: true,
    autoIndex: true
  }));

  server.listen(() => {
    const port = server.address().port;
    const options = {
      uri: `http://localhost:${port}/brotli`,
      headers: {
        'accept-encoding': 'gzip, deflate, br'
      }
    };

    request.get(options, (err, res) => {
      t.ifError(err);
      t.equal(res.statusCode, 200);
      t.equal(res.headers['content-encoding'], 'gzip');
    });
  });
  t.once('end', () => {
    server.close();
  });
});

test('serves unencoded file when compression not accepted', (t) => {
  t.plan(3);

  const server = http.createServer(ecstatic({
    root,
    brotli: true,
    gzip: true,
    autoIndex: true
  }));

  server.listen(() => {
    const port = server.address().port;
    const options = {
      uri: `http://localhost:${port}/brotli`,
      headers: {
        'accept-encoding': ''
      }
    };

    request.get(options, (err, res) => {
      t.ifError(err);
      t.equal(res.statusCode, 200);
      t.equal(res.headers['content-encoding'], undefined);
    });
  });
  t.once('end', () => {
    server.close();
  });
});

test('serves unencoded file when compression not enabled', (t) => {
  t.plan(3);

  const server = http.createServer(ecstatic({
    root,
    brotli: false,
    gzip: false,
    autoIndex: true
  }));

  server.listen(() => {
    const port = server.address().port;
    const options = {
      uri: `http://localhost:${port}/brotli`,
      headers: {
        'accept-encoding': 'gzip, deflate, br'
      }
    };

    request.get(options, (err, res) => {
      t.ifError(err);
      t.equal(res.statusCode, 200);
      t.equal(res.headers['content-encoding'], undefined);
    });
  });
  t.once('end', () => {
    server.close();
  });
});
