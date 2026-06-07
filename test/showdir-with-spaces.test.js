'use strict';

const test = require('tap').test;
const ecstatic = require('../lib/core');
const http = require('http');
const request = require('request');
const path = require('path');
const fs = require('fs');
const os = require('os');

const root = `${__dirname}/public`;
const baseDir = 'base';
function getDisplayNameIndex(body, filename) {
  return body.indexOf('>' + filename + '<');
}

test('directory listing when directory name contains spaces', (t) => {
  require('portfinder').getPort((err, port) => {
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
        t.ok(/href="\.\/index.html"/.test(body), 'We found the right href');
        server.close();
        t.end();
      });
    });
  });
});

test('directory listing can sort files by modified time', (t) => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'http-server-sort-mtime-'));
  const older = path.join(tmpRoot, 'older.txt');
  const newer = path.join(tmpRoot, 'newer.txt');

  fs.writeFileSync(older, 'older');
  fs.writeFileSync(newer, 'newer');
  fs.utimesSync(older, new Date('2024-01-01T00:00:00Z'), new Date('2024-01-01T00:00:00Z'));
  fs.utimesSync(newer, new Date('2024-01-02T00:00:00Z'), new Date('2024-01-02T00:00:00Z'));

  const server = http.createServer(
    ecstatic({
      root: tmpRoot,
      showDir: true,
      autoIndex: false,
      sort: 'modified',
    })
  );

  server.listen(0, () => {
    const port = server.address().port;
    request.get({
      uri: `http://localhost:${port}/`,
    }, (err, res, body) => {
      t.error(err);
      t.equal(res.statusCode, 200);
      t.ok(
        getDisplayNameIndex(body, 'newer.txt') < getDisplayNameIndex(body, 'older.txt'),
        'newer modified file is listed first'
      );
      server.close();
      fs.rmSync(tmpRoot, { recursive: true, force: true });
      t.end();
    });
  });
});

test('directory listing can sort files by creation time', (t) => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'http-server-sort-birthtime-'));
  const older = path.join(tmpRoot, 'older.txt');
  const newer = path.join(tmpRoot, 'newer.txt');

  fs.writeFileSync(older, 'older');
  setTimeout(() => {
    fs.writeFileSync(newer, 'newer');

    const server = http.createServer(
      ecstatic({
        root: tmpRoot,
        showDir: true,
        autoIndex: false,
        sort: 'created',
      })
    );

    server.listen(0, () => {
      const port = server.address().port;
      request.get({
        uri: `http://localhost:${port}/`,
      }, (err, res, body) => {
        t.error(err);
        t.equal(res.statusCode, 200);
        t.ok(
          getDisplayNameIndex(body, 'newer.txt') < getDisplayNameIndex(body, 'older.txt'),
          'newer created file is listed first'
        );
        server.close();
        fs.rmSync(tmpRoot, { recursive: true, force: true });
        t.end();
      });
    });
  }, 20);
});
