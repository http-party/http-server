'use strict';

const test = require('tap').test;
const server = require('../lib/core');
const http = require('http');
const path = require('path');
const request = require('request');

const root = path.join(__dirname, 'public');

test('isolate defaults to false', (t) => {
  t.plan(4);

  const httpServer = http.createServer(
    server({
      root,
      autoIndex: true,
      defaultExt: 'html',
    })
  );

  httpServer.listen(() => {
    const port = httpServer.address().port;
    const uri = `http://localhost:${port}/subdir/index.html`;

    request.get({ uri }, (err, res) => {
      t.ifError(err);
      t.equal(res.statusCode, 200);
      t.type(res.headers['cross-origin-embedder-policy'], 'undefined');
      t.type(res.headers['cross-origin-opener-policy'], 'undefined');
    });
  });
  t.once('end', () => {
    httpServer.close();
  });
});

test('isolate set to false', (t) => {
  t.plan(4);

  const httpServer = http.createServer(
    server({
      root,
      isolate: false,
      autoIndex: true,
      defaultExt: 'html',
    })
  );

  httpServer.listen(() => {
    const port = httpServer.address().port;
    const uri = `http://localhost:${port}/subdir/index.html`;

    request.get({ uri }, (err, res) => {
      t.ifError(err);
      t.equal(res.statusCode, 200);
      t.type(res.headers['cross-origin-embedder-policy'], 'undefined');
      t.type(res.headers['cross-origin-opener-policy'], 'undefined');
    });
  });
  t.once('end', () => {
    httpServer.close();
  });
});

test('isolate set to true', (t) => {
  t.plan(4);

  const httpServer = http.createServer(
    server({
      root,
      isolate: true,
      autoIndex: true,
      defaultExt: 'html',
    })
  );

  httpServer.listen(() => {
    const port = httpServer.address().port;
    const uri = `http://localhost:${port}/subdir/index.html`;
    request.get({ uri }, (err, res) => {
      t.ifError(err);
      t.equal(res.statusCode, 200);
      t.equal(res.headers['cross-origin-embedder-policy'], 'require-corp');
      t.equal(res.headers['cross-origin-opener-policy'], 'same-origin');
    });
  });
  t.once('end', () => {
    httpServer.close();
  });
});
