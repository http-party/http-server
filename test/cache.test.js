'use strict';

const test = require('tap').test;
const http = require('http');
const request = require('request');
const ecstatic = require('../lib/core');

test('custom cache option number', (t) => {
  let server = null;
  try {
    server = http.createServer(ecstatic({
      root: `${__dirname}/public/`,
      cache: 3600,
    }));
  } catch (e) {
    t.fail(e.message);
    t.end();
  }

  t.plan(3);

  server.listen(0, () => {
    const port = server.address().port;
    request.get(`http://localhost:${port}/a.txt`, (err, res) => {
      t.ifError(err);
      t.equal(res.statusCode, 200, 'a.txt should be found');
      t.equal(res.headers['cache-control'], 'max-age=3600');
      server.close(() => { t.end(); });
    });
  });
});

test('custom cache option string', (t) => {
  let server = null;
  try {
    server = http.createServer(ecstatic({
      root: `${__dirname}/public/`,
      cache: 'max-whatever=3600',
    }));
  } catch (e) {
    t.fail(e.message);
    t.end();
  }

  t.plan(3);

  server.listen(0, () => {
    const port = server.address().port;
    request.get(`http://localhost:${port}/a.txt`, (err, res) => {
      t.ifError(err);
      t.equal(res.statusCode, 200, 'a.txt should be found');
      t.equal(res.headers['cache-control'], 'max-whatever=3600');
      server.close(() => { t.end(); });
    });
  });
});

test('custom cache option function returning a number', (t) => {
  let i = 0;
  let server = null;
  try {
    server = http.createServer(ecstatic({
      root: `${__dirname}/public/`,
      cache() {
        i += 1;
        return i;
      },
    }));
  } catch (e) {
    t.fail(e.message);
    t.end();
  }

  t.plan(6);

  server.listen(0, () => {
    const port = server.address().port;
    request.get(`http://localhost:${port}/a.txt`, (err, res) => {
      t.ifError(err);
      t.equal(res.statusCode, 200, 'a.txt should be found');
      t.equal(res.headers['cache-control'], 'max-age=1');

      request.get(`http://localhost:${port}/a.txt`, (err2, res2) => {
        t.ifError(err2);
        t.equal(res2.statusCode, 200, 'a.txt should be found');
        t.equal(res2.headers['cache-control'], 'max-age=2');
        server.close(() => { t.end(); });
      });
    });
  });
});

test('custom cache option function returning a string', (t) => {
  let i = 0;
  let server = null;
  try {
    server = http.createServer(ecstatic({
      root: `${__dirname}/public/`,
      cache() {
        i += 1;
        return `max-meh=${i}`;
      },
    }));
  } catch (e) {
    t.fail(e.message);
    t.end();
  }

  t.plan(6);

  server.listen(0, () => {
    const port = server.address().port;
    request.get(`http://localhost:${port}/a.txt`, (err, res) => {
      t.ifError(err);
      t.equal(res.statusCode, 200, 'a.txt should be found');
      t.equal(res.headers['cache-control'], 'max-meh=1');

      request.get(`http://localhost:${port}/a.txt`, (err2, res2) => {
        t.ifError(err2);
        t.equal(res2.statusCode, 200, 'a.txt should be found');
        t.equal(res2.headers['cache-control'], 'max-meh=2');
        server.close(() => { t.end(); });
      });
    });
  });
});
