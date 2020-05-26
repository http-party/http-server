'use strict';

const test = require('tap').test;
const ecstatic = require('../lib/core');
const http = require('http');
const request = require('request');

const root = `${__dirname}/public`;

test('properly handles whitespace in accept-encoding', (t) => {
  t.plan(3);

  const server = http.createServer(ecstatic({
    root,
    autoIndex: true,
    gzip: true
  }));

  server.listen(() => {
    const port = server.address().port;
    const options = {
      uri: `http://localhost:${port}/gzip`,
      headers: {
        'accept-encoding': ' gzip, deflate'
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

test('properly handles single accept-encoding entry', (t) => {
  t.plan(3);

  const server = http.createServer(ecstatic({
    root,
    autoIndex: true,
    gzip: true
  }));

  server.listen(() => {
    const port = server.address().port;
    const options = {
      uri: `http://localhost:${port}/gzip`,
      headers: {
        'accept-encoding': 'gzip'
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
