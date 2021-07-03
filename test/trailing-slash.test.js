'use strict';

const test = require('tap').test;
const ecstatic = require('../lib/core');
const http = require('http');
const request = require('request');

test('should not add trailing slash when showDir and autoIndex are off', (t) => {
  t.plan(3);
  const server = http.createServer(
    ecstatic({
      root: `${__dirname}/public`,
      autoIndex: false,
      showDir: false,
    })
  );
  t.on('end', () => { server.close(); });
  server.listen(0, () => {
    const port = server.address().port;
    request.get(`http://localhost:${port}/subdir`, (err, res) => {
      t.ifError(err);
      t.equal(res.statusCode, 404);
      t.equal(res.body, 'File not found. :(');
    });
  });
});
