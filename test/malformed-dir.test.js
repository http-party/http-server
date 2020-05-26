'use strict';

const test = require('tap').test;
const ecstatic = require('../lib/core');
const http = require('http');
const request = require('request');

test('malformed showdir uri', (t) => {
  const server = http.createServer(ecstatic(__dirname, { showDir: true }));

  t.plan(2);

  server.listen(0, () => {
    request.get(`http://localhost:${server.address().port}/?%`, (err, res) => {
      t.ifError(err);
      t.equal(res.statusCode, 400);
      server.close(() => { t.end(); });
    });
  });
});
