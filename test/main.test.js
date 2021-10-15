const test = require('tap').test;
const path = require('path');
const fs = require('fs');
const request = require('request');
const httpServer = require('../lib/http-server');
const promisify = require('util').promisify;

const requestAsync = promisify(request);
const fsReadFile = promisify(fs.readFile);

// Prevent errors from being swallowed
process.on('uncaughtException', console.error);

const root = path.join(__dirname, 'fixtures', 'root');

// Tests are grouped into those which can run together. The groups are given
// their own port to run on and live inside a Promise. Tests are done when all
// Promise test groups complete.
test('http-server main', (t) => {
  Promise.all([
    new Promise((resolve) => {
      const server = httpServer.createServer({
        root,
        robots: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true'
        },
        cors: true,
        corsHeaders: 'X-Test',
        ext: true,
        brotli: true,
        gzip: true
      });
      server.listen(8080, async () => {
        try {

          // Since none of these depend on anything not already declared, they
          // can run on the event loop at their own leisure
          await Promise.all([
            // request file from root
            requestAsync("http://localhost:8080/file").then(async (res) => {
              // files should be served from the root
              t.equal(res.statusCode, 200);

              const fileData = await fsReadFile(path.join(root, 'file'), 'utf8');
              t.equal(res.body.trim(), fileData.trim(), 'root file content matches');
            }).catch(err => t.fail(err.toString())),

            // Request non-existent file
            requestAsync("http://localhost:8080/404").then(res => {
              t.ok(res);
              t.equal(res.statusCode, 404);
            }).catch(err => t.fail(err.toString())),

            // Request root
            requestAsync("http://localhost:8080/").then(res => {
              t.ok(res);
              t.equal(res.statusCode, 200);
              t.includes(res.body, './file');
              t.includes(res.body, './canYouSeeMe');

              // Custom headers
              t.equal(res.headers['access-control-allow-origin'], '*');
              t.equal(res.headers['access-control-allow-credentials'], 'true');
            }).catch(err => t.fail(err.toString())),

            // Get robots
            requestAsync("http://localhost:8080/robots.txt").then(res => {
              t.equal(res.statusCode, 200);
            }).catch(err => t.fail(err.toString())),

            // CORS time
            requestAsync({
              uri: 'http://localhost:8080',
              method: 'OPTIONS',
              headers: {
                'Access-Control-Request-Method': 'GET',
                Origin: 'http://example.com',
                'Access-Control-Request-Headers': 'Foobar'
              }
            }).then(res => {
              t.equal(res.statusCode, 204);
              t.ok(
                res.headers['access-control-allow-headers']
                  .split(/\s*,\s*/g)
                  .indexOf('X-Test') >= 0, 204);
            }).catch(err => t.fail(err.toString())),

            t.test(
              "Regression: don't crash on control characters in query strings",
              {},
              (t) => {
                requestAsync({
                  uri: encodeURI('http://localhost:8080/file?\x0cfoo'),
                }).then(res => {
                  t.equal(res.statusCode, 200);
                }).catch(err => t.fail(err.toString()))
                  .finally(() => t.end());
              }
            ),

            // Light compression testing. Heavier compression tests exist in
            // compression.test.js
            requestAsync({
              uri: 'http://localhost:8080/compression/',
              headers: {
                'accept-encoding': 'gzip'
              }
            }).then(res => {
              t.equal(res.statusCode, 200);
              t.equal(res.headers['content-encoding'], 'gzip');
            }).catch(err => t.fail(err.toString())),

            requestAsync({
              uri: 'http://localhost:8080/compression/',
              headers: {
                'accept-encoding': 'gzip, br'
              }
            }).then(res => {
              t.equal(res.statusCode, 200);
              t.equal(res.headers['content-encoding'], 'br');
            }).catch(err => t.fail(err.toString())),

            requestAsync("http://localhost:8080/htmlButNot").then(res => {
              t.equal(res.statusCode, 200);
              t.match(res.headers['content-type'], /^text\/html/);
            }).catch(err => t.fail(err.toString()))
          ]);

          // Another server proxies 8081 to 8080
          const proxyServer = httpServer.createServer({
            proxy: "http://localhost:8080",
            root: path.join(__dirname, 'fixtures')
          });

          await new Promise((resolve) => {
            proxyServer.listen(8081, async () => {
              try {
                // Serve files from proxy root
                await requestAsync("http://localhost:8081/root/file").then(async (res) => {
                  t.ok(res);
                  t.equal(res.statusCode, 200);

                  // File content matches
                  const fileData = await fsReadFile(path.join(root, 'file'), 'utf8');
                  t.equal(res.body.trim(), fileData.trim(), 'proxied root file content matches');
                }).catch(err => t.fail(err.toString()));

                // Proxy fallback
                await requestAsync("http://localhost:8081/file").then(async (res) => {
                  t.ok(res);
                  t.equal(res.statusCode, 200);

                  // File content matches
                  const fileData = await fsReadFile(path.join(root, 'file'), 'utf8');
                  t.equal(res.body.trim(), fileData.trim(), 'proxy fallback root file content matches');
                }).catch(err => t.fail(err.toString()));
              } catch (err) {
                t.fail(err.toString());
              } finally {
                proxyServer.close();
                resolve();
              }
            });
          });

        } catch (err) {
          t.fail(err.toString());
        } finally {
          server.close();
          resolve();
        }
      });
    }),
    new Promise((resolve) => {
      const server = httpServer.createServer({
        root,
        username: 'correct_username',
        password: 'correct_password'
      });

      server.listen(8082, async () => {
        try {
          await Promise.all([
            // Bad request with no auth
            requestAsync("http://localhost:8082/file").then((res) => {
              t.equal(res.statusCode, 401);
              t.equal(res.body, 'Access denied', 'Bad auth returns expected body');
            }).catch(err => t.fail(err.toString())),

            // bad user
            requestAsync("http://localhost:8082/file", {
              auth: {
                user: 'wrong_username',
                pass: 'correct_password'
              }
            }).then((res) => {
              t.equal(res.statusCode, 401);
              t.equal(res.body, 'Access denied', 'Bad auth returns expected body');
            }).catch(err => t.fail(err.toString())),

            // bad password
            requestAsync("http://localhost:8082/file", {
              auth: {
                user: 'correct_username',
                pass: 'wrong_password'
              }
            }).then((res) => {
              t.equal(res.statusCode, 401);
              t.equal(res.body, 'Access denied', 'Bad auth returns expected body');
            }).catch(err => t.fail(err.toString())),

            // nonexistant file, and bad auth
            requestAsync("http://localhost:8082/404", {
              auth: {
                user: 'correct_username',
                pass: 'wrong_password'
              }
            }).then((res) => {
              t.equal(res.statusCode, 401);
              t.equal(res.body, 'Access denied', 'Bad auth returns expected body');
            }).catch(err => t.fail(err.toString())),

            // good path, good auth
            requestAsync("http://localhost:8082/file", {
              auth: {
                user: 'correct_username',
                pass: 'correct_password'
              }
            }).then(async (res) => {
              t.equal(res.statusCode, 200);
              const fileData = await fsReadFile(path.join(root, 'file'), 'utf8');
              t.equal(res.body.trim(), fileData.trim(), 'auth-protected file with good auth has expected file content');
            }).catch(err => t.fail(err.toString())),
          ]);
        } catch (err) {
          t.fail(err.toString());
        } finally {
          server.close();
          resolve();
        }
      });
    }),

    new Promise((resolve) => {
      const server = httpServer.createServer({
        root,
        username: 'correct_username',
        password: 123456
      });

      server.listen(8083, async () => {
        try {
          await Promise.all([
            // regression test
            requestAsync("http://localhost:8083/file").then(res => {
              t.equal(res.statusCode, 401);
              t.equal(res.body, 'Access denied', 'Bad auth returns expected body');
            }).catch(err => t.fail(err.toString())),

            // regression test, bad username
            requestAsync("http://localhost:8083/file", {
              auth: {
                user: 'wrong_username',
                pass: '123456'
              }
            }).then(res => {
              t.equal(res.statusCode, 401);
              t.equal(res.body, 'Access denied', 'Bad auth returns expected body');
            }).catch(err => t.fail(err.toString())),

            // regression test, correct auth, even though the password is a
            // different type.
            requestAsync("http://localhost:8083/file", {
              auth: {
                user: 'correct_username',
                pass: '123456'
              }
            }).then(async (res) => {
              t.equal(res.statusCode, 200);
              const fileData = await fsReadFile(path.join(root, 'file'), 'utf8');
              t.equal(res.body.trim(), fileData.trim(), 'numeric auth with good auth has expected file content');
            }).catch(err => t.fail(err.toString()))
          ]);
        } catch (err) {
          t.fail(err.toString());
        } finally {
          server.close();
          resolve();
        }
      });
    }),
  ]).then(() => t.end())
    .catch(err => {
      t.fail(err.toString());
      t.end();
  });
});
