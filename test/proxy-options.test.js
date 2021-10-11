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

// Tests are grouped into those which can run together. The groups are given
// their own port to run on and live inside a Promise. Tests are done when all
// Promise test groups complete.
test('proxy options', (t) => {
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
    server.listen(8080, async () => {
      try {

        // Another server proxies 8081 to 8080
        const proxyServer = httpServer.createServer({
          proxy: 'http://localhost:8080',
          root: path.join(__dirname, 'fixtures'),
          tls: true,
          https: httpsOpts,
          proxyOptions: {
            secure: false
          }
        })

        await new Promise((resolve) => {
          proxyServer.listen(8081, async () => {
            try {
              // Serve files from proxy root
              await requestAsync('https://localhost:8081/root/file', { rejectUnauthorized: false }).then(async (res) => {
                t.ok(res)
                t.equal(res.statusCode, 200)

                // File content matches
                const fileData = await fsReadFile(path.join(root, 'file'), 'utf8')
                t.equal(res.body.trim(), fileData.trim(), 'proxied root file content matches')
              }).catch(err => t.fail(err.toString()))

              // Proxy fallback
              await requestAsync('https://localhost:8081/file', { rejectUnauthorized: false }).then(async (res) => {
                t.ok(res)
                t.equal(res.statusCode, 200)

                // File content matches
                const fileData = await fsReadFile(path.join(root, 'file'), 'utf8')
                t.equal(res.body.trim(), fileData.trim(), 'proxy fallback root file content matches')
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
