'use strict';

const test = require('tap').test;
const ecstatic = require('../lib/core');
const http = require('http');
const request = require('request');

test('can connect from all localhost addresses', t => {
  const server = http.createServer(ecstatic(`${__dirname}/public/subdir`));
  t.on('end', () => { server.close(); });
  server.listen(0, () => {
    const port = server.address().port;
    const addresses = [
      'localhost',
      '127.0.0.1',
      '::1',
    ];

    t.plan(addresses.length * 2);

    for (const address of addresses) {
      request.get(`http://[${address}]:${port}/index.html`, (err, res, body) => {
        t.error(err);
        t.equal(res.statusCode, 200);
      });
    }
  });
});
