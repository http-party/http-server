'use strict';

const test = require('tap').test;
const ecstatic = require('../lib/core');
const http = require('http');
const request = require('request');
const path = require('path');
const eol = require('eol');

const root = `${__dirname}/public`;
const baseDir = 'base';

require('fs').mkdirSync(`${root}/emptyDir`, {recursive: true});

const cases = require('./fixtures/common-cases');

test('core', (t) => {
  require('portfinder').getPort((err, port) => {
    const filenames = Object.keys(cases);

    const server = http.createServer(
      ecstatic({
        root,
        gzip: true,
        baseDir,
        autoIndex: true,
        showDir: true,
        defaultExt: 'html',
        handleError: true,
      })
    );

    server.listen(port, () => {
      let pending = filenames.length;
      filenames.forEach((file) => {
        const uri = `http://localhost:${port}${path.join('/', baseDir, file)}`;
        const headers = cases[file].headers || {};

        request.get({
          uri,
          followRedirect: false,
          headers,
        }, (err, res, body) => {
          if (err) {
            t.fail(err);
          }
          const r = cases[file];
          t.equal(res.statusCode, r.code, `status code for \`${file}\``);

          if (r.type !== undefined) {
            t.equal(
              res.headers['content-type'].split(';')[0], r.type,
              `content-type for \`${file}\``
            );
          }

          if (r.body !== undefined) {
            t.equal(eol.lf(body), r.body, `body for \`${file}\``);
          }

          if (r.location !== undefined) {
            t.equal(path.normalize(res.headers.location), path.join('/', baseDir, r.location), `location for \`${file}\``);
          }

          pending -= 1;
          if (pending === 0) {
            server.close();
            t.end();
          }
        });
      });
    });
  });
});
