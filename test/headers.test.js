'use strict';

const test = require('tap').test;
const ecstatic = require('../lib/core');
const http = require('http');
const request = require('request');

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

  server.listen(() => {
    const port = server.address().port;
    const uri = `http://localhost:${port}/subdir`;

    request.get({ uri }, (err, res) => {
      t.ifError(err);
      t.equal(res.statusCode, 200);
      t.equal(res.headers.wow, 'sweet');
      t.equal(res.headers.cool, 'beans');
    });
  });
  t.once('end', () => {
    server.close();
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

  server.listen(() => {
    const port = server.address().port;
    const uri = `http://localhost:${port}/subdir`;

    request.get({ uri }, (err, res) => {
      t.ifError(err);
      t.equal(res.statusCode, 200);
      t.equal(res.headers.beep, 'boop');
    });
  });
  t.once('end', () => {
    server.close();
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

  server.listen(() => {
    const port = server.address().port;
    const uri = `http://localhost:${port}/subdir`;
    request.get({ uri }, (err, res) => {
      t.ifError(err);
      t.equal(res.statusCode, 200);
      t.equal(res.headers.beep, 'boop');
    });
  });
  t.once('end', () => {
    server.close();
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

  server.listen(() => {
    const port = server.address().port;
    const uri = `http://localhost:${port}/subdir`;
    request.get({ uri }, (err, res) => {
      t.ifError(err);
      t.equal(res.statusCode, 200);
      t.equal(res.headers.beep, 'boop');
    });
  });
  t.once('end', () => {
    server.close();
  });
});
