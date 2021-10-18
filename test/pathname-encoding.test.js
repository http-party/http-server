'use strict';

const tap = require('tap');
const ecstatic = require('../lib/core');
const http = require('http');
const request = require('request');
const path = require('path');
const portfinder = require('portfinder');

const test = tap.test;

const root = `${__dirname}/public`;
const baseDir = 'base';

if (process.platform === 'win32') {
  tap.plan(0, 'Windows is allergic to < in path names');
  return;
}

const fs = require('fs');

test('create test directory', (t) => {
  fs.mkdirSync(`${root}/<dir>`, '0755');
  t.end();
});

test('directory listing with pathname including HTML characters', (t) => {
  portfinder.getPort((err, port) => {
    const uri = `http://localhost:${port}${path.join('/', baseDir, '/%3Cdir%3E')}`;
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
        t.notMatch(body, /<dir>/, 'We didn\'t find the unencoded pathname');
        t.match(body, /&#x3C;dir&#x3E;/, 'We found the encoded pathname');
        server.close();
        t.end();
      });
    });
  });
});

test('NULL byte in request path does not crash server', (t) => {
  portfinder.getPort((err, port) => {
    const uri = `http://localhost:${port}${path.join('/', baseDir, '/%00')}`;
    const server = http.createServer(
      ecstatic({
        root,
        baseDir,
      })
    );

    try {
    server.listen(port, () => {
      request.get({uri}, (err, res, body) => {
        t.pass('server did not crash')
        server.close();
        t.end();
      });
    });
    } catch (err) {
      t.fail(err.toString());
    }
  });
});

test('remove test directory', (t) => {
  fs.rmdirSync(`${root}/<dir>`);
  t.end();
});
