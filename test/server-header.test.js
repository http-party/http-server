'use strict';

const test = require('tap').test;
const ecstatic = require('../');
const http = require('http');
const request = require('request');

test('serverHeader should exist', (t) => {
  t.plan(2);

  const server = http.createServer(ecstatic(`${__dirname}/public/subdir`));

  t.on('end', () => { server.close(); });

  server.listen(0, () => {
    const port = server.address().port;
    request.get(`http://localhost:${port}`, (err, res) => {
      t.ifError(err);
      t.equal(res.headers.server, `ecstatic-${ecstatic.version}`);
    });
  });
});

test('serverHeader should not exist', (t) => {
  t.plan(2);

  const server = http.createServer(ecstatic(`${__dirname}/public/subdir`, {
    serverHeader: false,
  }));

  t.on('end', () => { server.close(); });

  server.listen(0, () => {
    const port = server.address().port;
    request.get(`http://localhost:${port}`, (err, res) => {
      t.ifError(err);
      t.equal(res.headers.server, undefined);
    });
  });
});
