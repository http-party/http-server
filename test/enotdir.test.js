'use strict';

const test = require('tap').test;
const ecstatic = require('../lib/core');
const http = require('http');
const request = require('request');

test('should handle ENOTDIR as 404', (t) => {
  t.plan(3);
  const server = http.createServer(ecstatic(`${__dirname}/public/subdir`));
  t.on('end', () => { server.close(); });
  server.listen(0, () => {
    const port = server.address().port;
    request.get(`http://localhost:${port}/index.html/hello`, (err, res, body) => {
      t.ifError(err);
      t.equal(res.statusCode, 404);
      t.equal(body, 'File not found. :(');
    });
  });
});
