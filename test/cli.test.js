'use strict';

/* this test suit is incomplete  2015-12-18 */

const test = require('tap').test;
const request = require('request');
const spawn = require('child_process').spawn;
const path = require('path');
const portfinder = require('portfinder');
const httpServer = require('../lib/http-server');

const node = process.execPath;

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

const stripAnsi = (str) => str.replace(/\u001b\[[0-9;]*m/g, '');

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

test('--proxy-all requires --proxy', (t) => {
  t.plan(1);

  const options = ['.', '--proxy-all', 'true'];
  const server = startServer(options);

  tearDown(server, t);

  server.on('exit', (code) => {
    t.equal(code, 1);
  });
});

test('--proxy-all does not consume following positional args', (t) => {
  t.plan(4);

  const root = path.resolve(__dirname, 'fixtures', 'root');
  const targetServer = httpServer.createServer({ root });

  targetServer.listen(0, () => {
    const targetPort = targetServer.address().port;
    getPort().then((port) => {
      const options = [
        '--proxy', `http://localhost:${targetPort}`,
        '--proxy-all',
        root,
        '--port', port
      ];
      const server = startServer(options);

      tearDown(server, t);
      t.teardown(() => targetServer.close());

      let sawRootLog = false;

      server.stdout.on('data', (msg) => {
        const text = stripAnsi(msg.toString());
        if (text.includes(root)) {
          sawRootLog = true;
        }
        checkServerIsRunning(`http://localhost:${port}`, msg, t, (err, res) => {
          if (err) {
            t.fail(err.toString());
            return;
          }

          t.ok(sawRootLog, 'root path should remain positional argument');
          t.equal(res.statusCode, 200, 'proxied request should succeed');
        });
      });
    });
  });
});

function doHeaderOptionTest(t, argv, obj) {
  getPort().then((port) => {
    const options = ['.', '--port', port].concat(argv);
    const server = startServer(options);

    tearDown(server, t);

    server.stdout.on('data', (msg) => {
      checkServerIsRunning(`http://localhost:${port}`, msg, t, (err, res) => {
        t.error(err);

        for (const [k, v] of Object.entries(obj)) {
          t.equal(res.headers[k], v, 'expected header value matches in response');
        }
      });
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

test('setting default content-type via cli', (t) => {
  t.plan(4);

  getPort().then((port) => {
    const root = path.resolve(__dirname, 'public/');
    const options = [root, '--port', port, '--content-type', 'text/custom'];
    const server = startServer(options);

    tearDown(server, t);

    server.stdout.on('data', (msg) => {
      checkServerIsRunning(`http://localhost:${port}/f_f`, msg, t, (err, res) => {
        t.error(err);
        t.equal(res.headers['content-type'], 'text/custom; charset=UTF-8');
      });
    });
  });
});
