'use strict';

const test = require('tap').test;
const http = require('http');
const request = require('request');
const ecstatic = require('../lib/core');

test('default extension file alongside a directory', async (t) => {
  const root = t.testdir({
    'users.html': '<p>users page</p>',
    users: {
      'index.html': '<p>users index</p>',
      'create.html': '<p>create user</p>',
    },
    other: { 'index.html': '<p>other index</p>' },
  });

  for (const defaultExt of ['html', 'txt']) {
    await t.test(`defaultExt=${defaultExt}`, async (t) => {
      const server = http.createServer(ecstatic({ root, defaultExt }));
      t.teardown(() => server.close());
      await new Promise((resolve) => server.listen(0, resolve));
      const uri = `http://localhost:${server.address().port}`;
      const cases = defaultExt === 'html' ? [
        { path: '/users', code: 200, body: '<p>users page</p>' },
        { path: '/users?search=value.ext', code: 200, body: '<p>users page</p>' },
        { path: '/users/', code: 200, body: '<p>users index</p>' },
        { path: '/users/create', code: 200, body: '<p>create user</p>' },
        { path: '/other', code: 302, location: '/other/' },
        { path: '/users', method: 'HEAD', code: 200, body: '' },
      ] : [
        { path: '/users', code: 302, location: '/users/' },
      ];

      for (const item of cases) {
        const { res, body } = await new Promise((resolve, reject) => {
          request({
            uri: uri + item.path,
            method: item.method || 'GET',
            followRedirect: false,
          }, (err, res, body) => {
            if (err) {
              reject(err);
            } else {
              resolve({ res, body });
            }
          });
        });
        t.equal(res.statusCode, item.code, `status for ${item.path}`);
        if (item.body !== undefined) {
          t.equal(body, item.body, `body for ${item.path}`);
        }
        if (item.location !== undefined) {
          t.equal(res.headers.location, item.location, `redirect for ${item.path}`);
        }
        if (item.method === 'HEAD') {
          t.equal(res.headers['content-length'], '17', 'head has the sibling file length');
        }
      }
    });
  }
});
