'use strict';

const test = require('tap').test;
const ecstatic = require('../lib/core');
const http = require('http');
const request = require('request');
const path = require('path');

const root = `${__dirname}/public`;
const baseDir = 'base';

test('url encoding in href', (t) => {
  const server = http.createServer(
    ecstatic({
      root,
      baseDir,
      showDir: true,
      autoIndex: false,
    })
  );

  server.listen(0, () => {
    const port = server.address().port;
    const uri = `http://localhost:${port}${path.join('/', baseDir, 'show-dir%24%24href_encoding%24%24')}`;
    request.get({
      uri,
    }, (err, res, body) => {
      t.match(body, /href="\.\/aname%2Baplus.txt"/, 'We found the right href');
      server.close();
      t.end();
    });
  });
});
