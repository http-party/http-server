'use strict';

const test = require('tap').test;
const ecstatic = require('../lib/core');
const http = require('http');
const request = require('request');
const path = require('path');

const root = `${__dirname}/public`;
const baseDir = 'base';

test('directory listing when directory name contains spaces', (t) => {
  const port = Math.floor((Math.random() * ((1 << 16) - 1e4)) + 1e4);
  const uri = `http://localhost:${port}${path.join('/', baseDir, 'subdir_with%20space')}`;

  const server = http.createServer(
    ecstatic({
      root,
      baseDir,
      showDir: true,
      autoIndex: false,
    })
  );

  server.listen(port, () => {
    request.get({
      uri,
    }, (err, res, body) => {
      t.ok(/href="\/base\/subdir_with%20space\/index.html"/.test(body), 'We found the right href');
      server.close();
      t.end();
    });
  });
});
