'use strict';

/* this test suit is incomplete  2015-12-18 */

const test = require('tap').test;
const request = require('request');
const spawn = require('child_process').spawn;
const path = require('path');
const portfinder = require('portfinder');

const node = process.execPath;
const defaultPort = 8080;

function startServer(args) {
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
  t.teardown(() => {
    ps.kill('SIGTERM');
  });
}

const getPort = () => new Promise((resolve, reject) => {
  portfinder.getPort((err, port) => {
    if (err) reject(err);
    resolve(port);
  });
});

test('setting port via cli - custom port', (t) => {
  t.plan(2);

  getPort().then((port) => {
    const options = ['.', '--port', port];
    const server = startServer(options);

    tearDown(server, t);

    server.stdout.on('data', (msg) => {
      checkServerIsRunning(`http://localhost:${port}`, msg, t);
    });
  });
});

test('setting mimeTypes via cli - .types file', (t) => {
  t.plan(4);

  getPort().then((port) => {
    const root = path.resolve(__dirname, 'public/');
    const pathMimetypeFile = path.resolve(__dirname, 'fixtures/custom_mime_type.types');
    const options = [root, '--port', port, '--mimetypes', pathMimetypeFile];
    const server = startServer(options);

    tearDown(server, t);

    server.stdout.on('data', (msg) => {
      checkServerIsRunning(`http://localhost:${port}/custom_mime_type.opml`, msg, t, (err, res) => {
        t.error(err);
        t.equal(res.headers['content-type'], 'application/secret');
      });
    });
  });
});

test('setting mimeTypes via cli - directly', (t) => {
  t.plan(4);

  getPort().then((port) => {
    const root = path.resolve(__dirname, 'public/');
    const mimeType = ['--mimetypes', '{ "application/x-my-type": ["opml"] }'];
    const options = [root, '--port', port].concat(mimeType);
    const server = startServer(options);

    // TODO: remove error handler
    tearDown(server, t);

    server.stdout.on('data', (msg) => {
      checkServerIsRunning(`http://localhost:${port}/custom_mime_type.opml`, msg, t, (err, res) => {
        t.error(err);
        t.equal(res.headers['content-type'], 'application/x-my-type');
      });
    });
  });
});

test('--proxy requires you to specify a protocol', (t) => {
  t.plan(1);
  
  const options = ['.', '--proxy', 'google.com'];
  const server = startServer(options);

  tearDown(server, t);

  server.on('exit', (code) => {
    t.equal(code, 1);
  });
});

function doHeaderOptionTest(t, argv, obj) {
  const options = ['.', '--port', defaultPort].concat(argv);
  const server = startServer(options);

  tearDown(server, t);

  server.stdout.on('data', (msg) => {
    checkServerIsRunning(`http://localhost:${defaultPort}`, msg, t, (err, res) => {
      t.error(err);

      for (const [k, v] of Object.entries(obj)) {
        t.equal(res.headers[k], v, 'expected header value matches in response');
      }
    });
  });
}

test('single --header option is applied', (t) => {
  t.plan(4);

  doHeaderOptionTest(t,
    ['--header=X-http-server-test-A: hello'],
    { 'x-http-server-test-a': 'hello' }
  );
});

test('single -H option is applied', (t) => {
  t.plan(4);

  doHeaderOptionTest(t,
    ['-H', 'X-http-server-test-A: hello'],
    { 'x-http-server-test-a': 'hello' }
  );
});

test('mix of multiple --header and -H options are applied', (t) => {
  t.plan(7);

  doHeaderOptionTest(t,
    [
      '--header=X-http-server-test-A: Lorem ipsum dolor sit amet',
      '-H', 'X-http-server-test-B: consectetur=adipiscing; elit',
      '-H', 'X-http-server-test-C: c',
      '--header=X-http-server-test-D: d'
    ],
    {
      'x-http-server-test-a': 'Lorem ipsum dolor sit amet',
      'x-http-server-test-b': 'consectetur=adipiscing; elit',
      'x-http-server-test-c': 'c',
      'x-http-server-test-d': 'd'
    }
  );
});

test('empty header value is allowed (RFC 7230)', (t) => {
  t.plan(5);

  doHeaderOptionTest(t,
    ['-H', 'X-http-server-test-empty-a:', '-H', 'X-http-server-test-empty-b'],
    { 'x-http-server-test-empty-a': '', 'x-http-server-test-empty-b': '' }
  );
});
