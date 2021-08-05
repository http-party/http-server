'use strict';

const test = require('tap').test;
const ecstatic = require('../lib/core');
const http = require('http');
const request = require('request');
const eol = require('eol');

test('default defaultExt', (t) => {
  t.plan(3);
  const server = http.createServer(ecstatic(`${__dirname}/public/subdir`));

  server.listen(0, () => {
    const port = server.address().port;
    request.get(`http://localhost:${port}`, (err, res, body) => {
      t.ifError(err);
      t.equal(res.statusCode, 200);
      t.equal(eol.lf(body), 'index!!!\n');
      server.close(() => { t.end(); });
    });
  });
});
