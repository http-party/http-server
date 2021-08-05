'use strict';

const test = require('tap').test;
const ecstatic = require('../lib/core');
const http = require('http');
const request = require('request');
const eol = require('eol');

test('range', (t) => {
  t.plan(4);
  const server = http.createServer(ecstatic(`${__dirname}/public/subdir`));
  t.on('end', () => { server.close(); });

  server.listen(0, () => {
    const port = server.address().port;
    const opts = {
      uri: `http://localhost:${port}/e.html`,
      headers: { range: '3-5' },
    };
    request.get(opts, (err, res, body) => {
      t.ifError(err);
      t.equal(res.statusCode, 206, 'partial content status code');
      t.equal(body, 'e!!');
      t.equal(parseInt(res.headers['content-length'], 10), body.length);
    });
  });
});

test('range past the end', (t) => {
  t.plan(4);
  const server = http.createServer(ecstatic(`${__dirname}/public/subdir`));
  t.on('end', () => { server.close(); });

  server.listen(0, () => {
    const port = server.address().port;
    const opts = {
      uri: `http://localhost:${port}/e.html`,
      headers: { range: '3-500' },
    };
    request.get(opts, (err, res, body) => {
      t.ifError(err);
      t.equal(res.statusCode, 206, 'partial content status code');
      t.equal(eol.lf(body), 'e!!</b>\n');
      t.equal(parseInt(res.headers['content-length'], 10), body.length);
    });
  });
});

test('NaN range', (t) => {
  t.plan(3);
  const server = http.createServer(ecstatic(`${__dirname}/public/subdir`));
  t.on('end', () => { server.close(); });

  server.listen(0, () => {
    const port = server.address().port;
    const opts = {
      uri: `http://localhost:${port}/e.html`,
      headers: { range: 'abc-def' },
    };
    request.get(opts, (err, res, body) => {
      t.ifError(err);
      t.equal(res.statusCode, 416, 'range error status code');
      t.equal(body, 'Requested range not satisfiable');
    });
  });
});

test('flipped range', (t) => {
  t.plan(3);
  const server = http.createServer(ecstatic(`${__dirname}/public/subdir`));
  t.on('end', () => { server.close(); });

  server.listen(0, () => {
    const port = server.address().port;
    const opts = {
      uri: `http://localhost:${port}/e.html`,
      headers: { range: '333-222' },
    };
    request.get(opts, (err, res, body) => {
      t.ifError(err);
      t.equal(res.statusCode, 416, 'range error status code');
      t.equal(body, 'Requested range not satisfiable');
    });
  });
});

test('partial range', (t) => {
  // 1 test is platform depedent "res.headers['content-range']"
  t.plan(5);
  const server = http.createServer(ecstatic(`${__dirname}/public/subdir`));
  t.on('end', () => { server.close(); });

  server.listen(0, () => {
    const port = server.address().port;
    const opts = {
      uri: `http://localhost:${port}/e.html`,
      headers: { range: '3-' },
    };
    request.get(opts, (err, res, body) => {
      t.ifError(err);
      t.equal(res.statusCode, 206, 'partial content status code');
      t.equal(eol.lf(body), 'e!!</b>\n');
      t.equal(parseInt(res.headers['content-length'], 10), body.length);
      if (eol.lf(body) != body) { // on Windows, depending on Git settings
        t.equal(res.headers['content-range'], 'bytes 3-11/12');
      } else {
        t.equal(res.headers['content-range'], 'bytes 3-10/11');
      }
    });
  });
});

test('include last-modified, etag and cache-control headers', (t) => {
  t.plan(4);
  const server = http.createServer(ecstatic(`${__dirname}/public/subdir`));
  t.on('end', () => { server.close(); });

  server.listen(0, () => {
    const port = server.address().port;
    const opts = {
      uri: `http://localhost:${port}/e.html`,
      headers: { range: '3-5' },
    };
    request.get(opts, (err, res) => {
      t.ifError(err);
      t.ok(res.headers['cache-control']);
      t.ok(res.headers['last-modified']);
      t.ok(res.headers.etag);
    });
  });
});
