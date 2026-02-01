const test = require('tap').test
const path = require('path')
const httpServer = require('../lib/http-server')
const request = require('request');

// Prevent errors from being swallowed
process.on('uncaughtException', console.error)

test('allowed hosts functionality', (t) => {
    t.plan(4);
    new Promise((resolve) => {
        const server = httpServer.createServer({
            root: path.join(__dirname, 'fixtures'),
            allowedHosts: ['localhost'],
        })

        server.listen(0, async () => {
            console.log('server listening on port', server.address().port)
            const port = server.address().port
            const url = `http://localhost:${port}`

            try {
                await new Promise((resolve, reject) => {
                    request.get({ 
                        url,
                        headers: {
                            Host: 'example.com'
                        }
                    }, (err, res) => {
                        console.log('response', err)
                        t.error(err);
                        t.equal(res.statusCode, 403);
                        resolve();
                    })
                })

                await new Promise((resolve, reject) => {
                    request.get({ 
                        url,
                        headers: {
                            Host: 'localhost'
                        }
                    }, (err, res) => {
                        console.log('response', err)
                        t.error(err);
                        t.equal(res.statusCode, 200);
                        resolve();
                    })
                })
            } catch (err) {
                t.fail(`allowed hosts test failed: ${err.message}`)
            } finally {
                server.close()
            }
        })
    })
})