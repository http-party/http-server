const test = require('tap').test;
const path = require('path');
const fs = require('fs').promises;
const request = require('request');
const httpServer = require('../lib/http-server');
const promisify = require('util').promisify;

const requestAsync = promisify(request);

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
          // request file from root
          await requestAsync("http://localhost:8080/file").then(async (res) => {
            // files should be served from the root
            t.equal(res.statusCode, 200);

            const fileData = await fs.readFile(path.join(root, 'file'), 'utf8');
            t.equal(res.body.trim(), fileData.trim());
          }).catch(err => t.fail(err));

          // Request non-existent file
          await requestAsync("http://localhost:8080/404").then(res => {
            t.ok(res);
            t.equal(res.statusCode, 404);
          }).catch(err => t.fail(err));

          // Request root
          await requestAsync("http://localhost:8080/").then(res => {
            t.ok(res);
            t.equal(res.statusCode, 200);
            t.includes(res.body, '/file');
            t.includes(res.body, '/canYouSeeMe');

            // Custom headers
            t.equal(res.headers['access-control-allow-origin'], '*');
            t.equal(res.headers['access-control-allow-credentials'], 'true');
          }).catch(err => t.fail(err));

          // Get robots
          await requestAsync("http://localhost:8080/robots.txt").then(res => {
            t.equal(res.statusCode, 200);
          }).catch(err => t.fail(err));

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
                  const fileData = await fs.readFile(path.join(root, 'file'), 'utf8');
                  t.equal(res.body.trim(), fileData.trim());
                }).catch(err => t.fail(err));

                // Proxy fallback
                await requestAsync("http://localhost:8081/file").then(res => {
                  t.ok(res);
                  t.equal(res.statusCode, 200);

                  // File content matches
                  const fileData = fs.readFileSync(path.join(root, 'file'), 'utf8');
                  t.equal(res.body.trim(), fileData.trim());
                }).catch(err => t.fail(err));
              } catch (err) {
                t.fail(err);
              } finally {
                proxyServer.close();
                resolve();
              }
            });
          });

          // CORS time
          await requestAsync({
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
          }).catch(err => t.fail(err));

          // Light compression testing. Heavier compression tests exist in
          // compression.test.js
          await requestAsync({
            uri: 'http://localhost:8080/compression/',
            headers: {
              'accept-encoding': 'gzip'
            }
          }).then(res => {
            t.equal(res.statusCode, 200);
            t.equal(res.headers['content-encoding'], 'gzip');
          }).catch(err => t.fail(err));

          await requestAsync({
            uri: 'http://localhost:8080/compression/',
            headers: {
              'accept-encoding': 'gzip, br'
            }
          }).then(res => {
            t.equal(res.statusCode, 200);
            t.equal(res.headers['content-encoding'], 'br');
          }).catch(err => t.fail(err));

          await requestAsync("http://localhost:8080/htmlButNot").then(res => {
            t.equal(res.statusCode, 200);
            t.match(res.headers['content-type'], /^text\/html/);
          }).catch(err => t.fail(err));

        } catch (err) {
          t.fail(err);
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

          // Bad request with no auth
          await requestAsync("http://localhost:8082/file").then((res) => {
            t.equal(res.statusCode, 401);
            t.equal(body, 'Access denied');
          }).catch(err => t.fail(err));

          // bad user
          await requestAsync("http://localhost:8082/file", {
            auth: {
              user: 'wrong_username',
              pass: 'correct_password'
            }
          }).then((res) => {
            t.equal(res.statusCode, 401);
            t.equal(body, 'Access denied');
          }).catch(err => t.fail(err));

          // bad password
          await requestAsync("http://localhost:8082/file", {
            auth: {
              user: 'correct_username',
              pass: 'wrong_password'
            }
          }).then((res) => {
            t.equal(res.statusCode, 401);
            t.equal(body, 'Access denied');
          }).catch(err => t.fail(err));

          // nonexistant file, and bad auth
          await requestAsync("http://localhost:8082/404", {
            auth: {
              user: 'correct_username',
              pass: 'wrong_password'
            }
          }).then((res) => {
            t.equal(res.statusCode, 401);
            t.equal(body, 'Access denied');
          }).catch(err => t.fail(err));

          // good path, good auth
          await requestAsync("http://localhost:8082/file", {
            auth: {
              user: 'correct_username',
              pass: 'correct_password'
            }
          }).then(async (res) => {
            t.equal(res.statusCode, 200);
            const fileData = await fs.readFile(path.join(root, 'file'), 'utf8');
            t.equal(res.body.trim(), fileData.trim());
          }).catch(err => t.fail(err));

        } catch (err) {
          t.fail(err);
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
          // regression test
          await requestAsync("http://localhost:8083/file").then(res => {
            t.equal(res.statusCode, 401);
            t.equal(res.body, 'Access denied');
          }).catch(err => t.fail(err));

          // regression test, bad username
          await requestAsync("http://localhost:8083/file", {
            auth: {
              user: 'wrong_username',
              pass: '123456'
            }
          }).then(res => {
            t.equal(res.statusCode, 401);
            t.equal(res.body, 'Access denied');
          }).catch(err => t.fail(err));

          // regression test, correct auth, even though the password is a
          // different type.
          await requestAsync("http://localhost:8083/file", {
            auth: {
              user: 'correct_username',
              pass: '123456'
            }
          }).then(async (res) => {
            t.equal(res.statusCode, 200);
            const fileData = await fs.readFile(path.join(root, 'file'), 'utf8');
            t.equal(res.body.trim(), fileData.trim());
          }).catch(err => t.fail(err));

        } catch (err) {
          t.fail(err);
        } finally {
          server.close();
          resolve();
        }
      });
    }),
  ]).catch(err => t.fail(err))
    .finally(() => t.end());
});
