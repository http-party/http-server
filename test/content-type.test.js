'use strict';

const test = require('tap').test;
const http = require('http');
const ecstatic = require('../lib/core');
const checkHeaders = require('./check-headers.js');

const root = `${__dirname}/public/`;

test('global default contentType', (t) => {
  let server = null;
  try {
    server = http.createServer(ecstatic({
      root,
      contentType: 'text/plain',
    }));
  } catch (e) {
    t.fail(e.message);
    t.end();
  }

  t.plan(3);

  
  checkHeaders(t, server, 'f_f', (t, headers) => {
    t.equal(headers['content-type'], 'text/plain; charset=UTF-8');
  });
});

test('content type text', (t) => {
  t.plan(3);

  const server = http.createServer(
    ecstatic({root})
  );

  checkHeaders(t, server, 'subdir/e.html', (t, headers) => {
    t.equal(headers['content-type'], 'text/html; charset=UTF-8');
  });
});

test('content type binary', (t) => {
  t.plan(3);

  const server = http.createServer(
    ecstatic({root})
  );

  checkHeaders(t, server, 'subdir/app.wasm', (t, headers) => {
    t.equal(headers['content-type'], 'application/wasm');
  });
});

test('charset arabic', (t) => {
  t.plan(3);

  const server = http.createServer(
    ecstatic({root})
  );

  checkHeaders(t, server, 'charset/arabic.html', (t, headers) => {
    t.equal(headers['content-type'], 'text/html; charset=ISO-8859-6');
  });
});

test('charset Shift_JIS', (t) => {
  t.plan(3);

  const server = http.createServer(
    ecstatic({root})
  );

  checkHeaders(t, server, 'charset/shift_jis.html', (t, headers) => {
    t.equal(headers['content-type'], 'text/html; charset=Shift_JIS');
  });
});
