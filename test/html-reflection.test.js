'use strict';

const test = require('tap').test;
const ecstatic = require('../');
const http = require('http');
const request = require('request');

test('html reflection prevented', (t) => {
  const server = http.createServer(ecstatic(`${__dirname}/public/containsSymlink`));

  server.listen(0, () => {
    const port = server.address().port;
    const attack = '<script>alert(\'xss\')</script>';
    request.get(`http://localhost:${port}/more-problematic/${attack}`, (err, res, body) => {
      if (body.indexOf('<script>') !== -1) {
        t.fail('Unescaped HTML reflected.');
      }
      server.close(() => { t.end(); });
    });
  });
});
