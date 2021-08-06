'use strict';

/* this test suit is incomplete  2015-12-18 */

const test = require('tap').test;
const request = require('request');
const spawn = require('child_process').spawn;
const path = require('path');

const node = process.execPath;
const defaultUrl = 'http://localhost';
const defaultPort = 8080;

function getRandomInt(min, max) {
  return Math.floor(Math.random() * ((max - min) + 1)) + min;
}

function startEcstatic(args) {
  return spawn(node, [require.resolve('../bin/http-server')].concat(args));
}

function checkServerIsRunning(url, msg, t, _cb) {
  if (!msg.toString().match(/Starting up/)) {
    return;
  }
  t.pass('http-server started');
  const cb = _cb || (() => {});

  request(url, (err, res) => {
    if (!err && res.statusCode !== 500) {
      t.pass('a successful request from the server was made');
      cb(null, res);
    } else {
      t.fail(`the server could not be reached @ ${url}`);
      cb(err);
    }
  });
}

function tearDown(ps, t) {
  t.tearDown(() => {
    ps.kill('SIGTERM');
  });
}

const getRandomPort = (() => {
  const usedPorts = [];
  return () => {
    const port = getRandomInt(1025, 65536);
    if (usedPorts.indexOf(port) > -1) {
      return getRandomPort();
    }

    usedPorts.push(port);
    return port;
  };
})();

test('setting port via cli - default port', (t) => {
  t.plan(2);

  const port = defaultPort;
  const options = ['.'];
  const ecstatic = startEcstatic(options);

  tearDown(ecstatic, t);

  ecstatic.stdout.on('data', (msg) => {
    checkServerIsRunning(`${defaultUrl}:${port}`, msg, t);
  });
});

test('setting port via cli - custom port', (t) => {
  t.plan(2);

  const port = getRandomPort();
  const options = ['.', '--port', port];
  const ecstatic = startEcstatic(options);

  tearDown(ecstatic, t);

  ecstatic.stdout.on('data', (msg) => {
    checkServerIsRunning(`${defaultUrl}:${port}`, msg, t);
  });
});

test('setting mimeTypes via cli - .types file', (t) => {
  t.plan(4);

  const port = getRandomPort();
  const root = path.resolve(__dirname, 'public/');
  const pathMimetypeFile = path.resolve(__dirname, 'fixtures/custom_mime_type.types');
  const options = [root, '--port', port, '--mimetypes', pathMimetypeFile];
  const ecstatic = startEcstatic(options);

  tearDown(ecstatic, t);

  ecstatic.stdout.on('data', (msg) => {
    checkServerIsRunning(`${defaultUrl}:${port}/custom_mime_type.opml`, msg, t, (err, res) => {
      t.error(err);
      t.equal(res.headers['content-type'], 'application/secret');
    });
  });
});

test('setting mimeTypes via cli - directly', (t) => {
  t.plan(4);

  const port = getRandomPort();
  const root = path.resolve(__dirname, 'public/');
  const mimeType = ['--mimetypes', '{ "application/x-my-type": ["opml"] }'];
  const options = [root, '--port', port].concat(mimeType);
  const ecstatic = startEcstatic(options);

  // TODO: remove error handler
  tearDown(ecstatic, t);

  ecstatic.stdout.on('data', (msg) => {
    checkServerIsRunning(`${defaultUrl}:${port}/custom_mime_type.opml`, msg, t, (err, res) => {
      t.error(err);
      t.equal(res.headers['content-type'], 'application/x-my-type');
    });
  });
});
