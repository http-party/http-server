const test = require('tap').test
const promisify = require('util').promisify
const httpServer = require('../lib/http-server')
const request = require('request')
const fs = require("fs");
const path = require("path");
const {getPort} = require("../lib/core/get-port.js");
const requestAsync = promisify(request)
const fsReadFile = promisify(fs.readFile)

// Prevent errors from being swallowed
process.on('uncaughtException', console.error)

test('cache response when configured', (t) => {
  t.plan(4);
  new Promise((resolve) => {
    const remoteServerRoot = path.join(__dirname, 'fixtures', 'root');
    const serverRoot = path.join(__dirname, 'cache');
    const cachedFilePath = path.join(serverRoot, 'file');
    const remoteFilePath = path.join(remoteServerRoot, 'file');

    const remoteServer = httpServer.createServer({
      root: remoteServerRoot,
    });

    getPort().then(remotePort => {
      remoteServer.listen(remotePort, async () => {
        try {
          const serverWithCache = httpServer.createServer({
            root: serverRoot,
            proxy: `http://localhost:${remotePort}`,
            proxyCache: './',
          });

          const serverPort = await getPort();

          await new Promise((resolve) => {
            serverWithCache.listen(serverPort, async () => {
              try {
                await requestAsync(`http://localhost:${serverPort}/file`).then(async (res) => {
                  t.ok(res)
                  t.equal(res.statusCode, 200);

                  const cachedFile = await fsReadFile(cachedFilePath, 'utf8');
                  const remoteFile = await fsReadFile(remoteFilePath, 'utf8');

                  t.equal(res.body.trim(), cachedFile.trim(), 'cached file content matches');
                  t.equal(cachedFile.trim(), remoteFile.trim(), 'cached file content matches remote file content');
                })
              } catch (err) {
                t.fail(err.toString())
              } finally {
                fs.rmSync(cachedFilePath);
                serverWithCache.close();
                resolve();
              }
            });
          });
        } catch (err) {
          t.fail(err.toString())
        } finally {
          remoteServer.close();
          resolve();
        }
      });
    })

  })
    .then(() => t.end())
    .catch(err => {
      t.fail(err.toString())
      t.end()
    })
});

test('decompress gzipped response before caching', (t) => {
  new Promise(resolve => {
    const remoteServerRoot = path.join(__dirname, 'public', 'gzip');
    const serverRoot = path.join(__dirname, 'cache');

    const remoteFilePath = path.join(remoteServerRoot, 'real_ecstatic');
    const cachedFilePath = path.join(serverRoot, 'real_ecstatic');


    const remoteServer = httpServer.createServer({
      root: remoteServerRoot,
      gzip: true,
    });

    getPort().then(remotePort => {
      remoteServer.listen(remotePort, async () => {
        try {
          const serverWithCache = httpServer.createServer({
            root: serverRoot,
            proxy: `http://localhost:${remotePort}`,
            proxyCache: './',
          });

          const serverPort = await getPort();
          await new Promise((resolve) => {
            serverWithCache.listen(serverPort, async () => {
              try {
                await requestAsync({
                  uri: `http://localhost:${serverPort}/real_ecstatic`,
                  headers: {
                    'accept-encoding': 'gzip, deflate, br'
                  }
                }).then(async (res) => {
                  t.ok(res)
                  t.equal(res.statusCode, 200, 'response is 200');
                  t.equal(res.headers['content-encoding'], 'gzip', 'response is gzipped');

                  const cachedFile = await fsReadFile(cachedFilePath, 'utf8');
                  const remoteFile = await fsReadFile(remoteFilePath, 'utf8');

                  t.equal(cachedFile.trim(), remoteFile.trim(), 'cached file content matches remote file content');
                })
              } catch (err) {
                t.fail(err.toString())
              } finally {
                fs.rmSync(cachedFilePath);
                serverWithCache.close();
                resolve();
              }
            });
          });
        } catch (err) {
          t.fail(err.toString())
        } finally {
          remoteServer.close();
          resolve();
        }

      });
    })
  })
    .then(() => t.end())
    .catch(err => {
      t.fail(err.toString())
      t.end()
    })
});

test('decompress brotli response before caching', (t) => {
  new Promise(resolve => {
    const remoteServerRoot = path.join(__dirname, 'public', 'brotli');
    const serverRoot = path.join(__dirname, 'cache');

    const remoteFilePath = path.join(remoteServerRoot, 'real_ecstatic');
    const cachedFilePath = path.join(serverRoot, 'real_ecstatic');


    const remoteServer = httpServer.createServer({
      root: remoteServerRoot,
      brotli: true,
    });

    getPort().then(remotePort => {
      remoteServer.listen(remotePort, async () => {
        try {
          const serverWithCache = httpServer.createServer({
            root: serverRoot,
            proxy: `http://localhost:${remotePort}`,
            proxyCache: './',
          });

          const serverPort = await getPort();
          await new Promise((resolve) => {
            serverWithCache.listen(serverPort, async () => {
              try {
                await requestAsync({
                  uri: `http://localhost:${serverPort}/real_ecstatic`,
                  headers: {
                    'accept-encoding': 'gzip, deflate, br'
                  }
                }).then(async (res) => {
                  t.ok(res)
                  t.equal(res.statusCode, 200, 'response is 200');
                  t.equal(res.headers['content-encoding'], 'br', 'response is brotli');

                  const cachedFile = await fsReadFile(cachedFilePath, 'utf8');
                  const remoteFile = await fsReadFile(remoteFilePath, 'utf8');

                  t.equal(cachedFile.trim(), remoteFile.trim(), 'cached file content matches remote file content');
                })
              } catch (err) {
                t.fail(err.toString())
              } finally {
                fs.rmSync(cachedFilePath);
                serverWithCache.close();
                resolve();
              }
            });
          });
        } catch (err) {
          t.fail(err.toString())
        } finally {
          remoteServer.close();
          resolve();
        }

      });
    })
  })
    .then(() => t.end())
    .catch(err => {
      t.fail(err.toString())
      t.end()
    })
});
