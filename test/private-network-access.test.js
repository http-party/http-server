'use strict';

const test = require('tap').test;
const server = require('../lib/core');
const http = require('http');
const path = require('path');
const request = require('request');

const root = path.join(__dirname, 'public');

test('private-network-access defaults to false', (t) => {
  t.plan(3);

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
      t.type(res.headers['access-control-allow-private-network'], 'undefined');
    });
  });
  t.once('end', () => {
    httpServer.close();
  });
});

test('privateNetworkAccess set to false', (t) => {
  t.plan(3);

  const httpServer = http.createServer(
    server({
      root,
      privateNetworkAccess: false,
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
      t.type(res.headers['access-control-allow-private-network'], 'undefined');
    });
  });
  t.once('end', () => {
    httpServer.close();
  });
});

test('privateNetworkAccess set to true', (t) => {
  t.plan(3);

  const httpServer = http.createServer(
    server({
      root,
      privateNetworkAccess: true,
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
      t.equal(res.headers['access-control-allow-private-network'], 'true');
    });
  });
  t.once('end', () => {
    httpServer.close();
  });
});
