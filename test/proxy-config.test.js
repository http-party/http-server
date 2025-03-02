const test = require('tap').test
const path = require('path')
const fs = require('fs')
const request = require('request')
const httpServer = require('../lib/http-server')
const promisify = require('util').promisify

const requestAsync = promisify(request)
const fsReadFile = promisify(fs.readFile)

// Prevent errors from being swallowed
process.on('uncaughtException', console.error)

const root = path.join(__dirname, 'fixtures', 'root')
const httpsOpts = {
  key: path.join(__dirname, 'fixtures', 'https', 'agent2-key.pem'),
  cert: path.join(__dirname, 'fixtures', 'https', 'agent2-cert.pem')
}

const proxyConfigTest = {
  "/rewrite/*": {
    "target": "http://localhost:8082",
    "pathRewrite": {
      "^/rewrite": ""
    }
  },
  "*": {
    "target": "http://localhost:8082",
    "changeOrigin": true,
    "secure": false
  }
}

// Tests are grouped into those which can run together. The groups are given
// their own port to run on and live inside a Promise. Tests are done when all
// Promise test groups complete.
test('proxy config', (t) => {
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
    })
    // TODO #723 we should use portfinder
    server.listen(8082, async () => {
      try {

        // Another server proxies 8083 to 8082
        const proxyServer = httpServer.createServer({
          //tls: true,
          //https: httpsOpts,
          proxyConfig: proxyConfigTest
        })

        await new Promise((resolve) => {
          proxyServer.listen(8083, async () => {
            try {
              // Serve files from proxy root
              await requestAsync('http://localhost:8083/file', { rejectUnauthorized: false }).then(async (res) => {
                t.ok(res)
                t.equal(res.statusCode, 200)

                // File content matches
                const fileData = await fsReadFile(path.join(root, 'file'), 'utf8')
                t.equal(res.body.trim(), fileData.trim(), 'proxied file content matches')
              }).catch(err => t.fail(err.toString()))

              // Serve files from proxy with rewrite
              await requestAsync('http://localhost:8083/rewrite/file', { rejectUnauthorized: false }).then(async (res) => {
                t.ok(res)
                t.equal(res.statusCode, 200)

                // File content matches
                const fileData = await fsReadFile(path.join(root, 'file'), 'utf8')
                t.equal(res.body.trim(), fileData.trim(), 'proxied file content matches')
              }).catch(err => t.fail(err.toString()))
            } catch (err) {
              t.fail(err.toString())
            } finally {
              proxyServer.close()
              resolve()
            }
          })
        })

      } catch (err) {
        t.fail(err.toString())
      } finally {
        server.close()
        resolve()
      }
    })
  })
    .then(() => t.end())
    .catch(err => {
      t.fail(err.toString())
      t.end()
    })
})
