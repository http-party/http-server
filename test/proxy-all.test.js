'use strict';

const http = require('http');
const test = require('tap').test;
const path = require('path');
const fs = require('fs');
const request = require('request');
const { promisify } = require('util');

const httpServer = require('../lib/http-server');

const requestAsync = promisify(request);
const REQUEST_TIMEOUT = 5000;

function listen(server) {
  return new Promise((resolve, reject) => {
    const underlying = server.server || server;
    const onError = (err) => {
      underlying.removeListener('error', onError);
      reject(err);
    };
    underlying.once('error', onError);
    server.listen(0, () => {
      underlying.removeListener('error', onError);
      resolve((underlying.address() || {}).port);
    });
  });
}

function requestWithTimeout(url) {
  return requestAsync({ url, timeout: REQUEST_TIMEOUT });
}

test('proxyAll requires a proxy target', (t) => {
  t.throws(() => {
    httpServer.createServer({ proxyAll: true });
  }, /proxy/i, 'proxyAll without proxy should throw');
  t.end();
});

test('proxyAll routes every request through the proxy target', async (t) => {
  t.plan(4);

  const localRoot = path.join(__dirname, 'fixtures', 'proxy-all-local');
  const remoteContent = fs.readFileSync(path.join(__dirname, 'fixtures', 'root', 'file'), 'utf8').trim();
  const localContent = fs.readFileSync(path.join(localRoot, 'file'), 'utf8').trim();

  const remoteServer = http.createServer((req, res) => {
    if (req.url === '/file') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(remoteContent);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('File not found. :(');
  });
  const remotePort = await listen(remoteServer);

  const proxyServer = httpServer.createServer({
    root: localRoot,
    proxy: `http://localhost:${remotePort}`,
    proxyAll: true
  });
  const proxyPort = await listen(proxyServer);

  t.teardown(() => {
    proxyServer.close();
    remoteServer.close();
  });

  const proxied = await requestWithTimeout(`http://localhost:${proxyPort}/file`);
  t.equal(proxied.body.trim(), remoteContent, 'response matches proxy target');
  t.notSame(proxied.body.trim(), localContent, 'local files are ignored when proxyAll is set');

  const missing = await requestWithTimeout(`http://localhost:${proxyPort}/does-not-exist`);
  t.equal(missing.statusCode, 404, 'status code comes from proxy target');
  t.match(missing.body, /file not found/i, 'body matches proxy response');
});
