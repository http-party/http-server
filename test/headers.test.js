'use strict';

const test = require('tap').test;
const ecstatic = require('../lib/core');
const http = require('http');
const checkHeaders = require('./check-headers.js');

const root = `${__dirname}/public`;

test('headers object', (t) => {
  t.plan(4);

  const server = http.createServer(
    ecstatic({
      root,
      headers: {
        Wow: 'sweet',
        Cool: 'beans',
      },
      autoIndex: true,
      defaultExt: 'html',
    })
  );

  checkHeaders(t, server, 'subdir', (t, headers) => {
    t.equal(headers.wow, 'sweet');
    t.equal(headers.cool, 'beans');
  });
});

test('header string', (t) => {
  t.plan(3);

  const server = http.createServer(
    ecstatic({
      root,
      header: 'beep: boop', // for command-line --header 'beep: boop'
      autoIndex: true,
      defaultExt: 'html',
    })
  );

  checkHeaders(t, server, 'subdir', (t, headers) => {
    t.equal(headers.beep, 'boop');
  });
});

test('header array', (t) => {
  t.plan(3);

  const server = http.createServer(
    ecstatic({
      root,
      header: [
        'beep: boop', // --header 'beep: boop'
        'what: ever', // --header 'what: ever'
      ],
      autoIndex: true,
      defaultExt: 'html',
    })
  );

  checkHeaders(t, server, 'subdir', (t, headers) => {
    t.equal(headers.beep, 'boop');
  });
});

test('H array', (t) => {
  t.plan(3);

  const server = http.createServer(
    ecstatic({
      root,
      H: [
        'beep: boop', // -H 'beep: boop'
        'what: ever', // -H 'what: ever'
      ],
      autoIndex: true,
      defaultExt: 'html',
    })
  );

  checkHeaders(t, server, 'subdir', (t, headers) => {
    t.equal(headers.beep, 'boop');
  });
});
