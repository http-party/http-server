const test = require('tap').test
const path = require('path')
const http = require('http')
const httpServer = require('../lib/http-server')
const WebSocket = require('ws')

// Prevent errors from being swallowed
process.on('uncaughtException', console.error)

test('websocket proxy functionality', (t) => {
    new Promise((resolve) => {
        // Create a target server that will handle websocket connections
        const targetServer = http.createServer()
        const targetWss = new WebSocket.Server({ server: targetServer })

        targetWss.on('connection', (ws) => {
            ws.on('message', (message) => {
                // Echo the message back
                ws.send(`Echo: ${message}`)
            })
        })

        targetServer.listen(0, () => {
            const targetPort = targetServer.address().port
            const targetUrl = `http://localhost:${targetPort}`

            // Create http-server with websocket proxy enabled
            const proxyServer = httpServer.createServer({
                proxy: targetUrl,
                websocket: true,
                root: path.join(__dirname, 'fixtures')
            })

            proxyServer.listen(0, async () => {
                const proxyPort = proxyServer.server.address().port
                const proxyUrl = `http://localhost:${proxyPort}`

                try {
                    // Test 1: Verify websocket proxy is enabled when both proxy and websocket options are set
                    t.ok(proxyServer.server.listeners('upgrade').length > 0, 'upgrade event listener should be registered')

                    // Test 2: Test websocket connection through proxy
                    await new Promise((resolve, reject) => {
                        const ws = new WebSocket(`ws://localhost:${proxyPort}`)

                        ws.on('open', () => {
                            t.pass('websocket connection should be established through proxy')

                            // Send a test message
                            ws.send('Hello WebSocket!')
                        })

                        ws.on('message', (data) => {
                            t.equal(data.toString(), 'Echo: Hello WebSocket!', 'should receive echoed message')
                            ws.close()
                        })

                        ws.on('close', () => {
                            t.pass('websocket connection should close properly')
                            resolve()
                        })

                        ws.on('error', (err) => {
                            t.fail(`websocket error: ${err.message}`)
                            reject(err)
                        })

                        // Set timeout to prevent hanging
                        setTimeout(() => {
                            ws.close()
                            reject(new Error('WebSocket test timeout'))
                        }, 5000)
                    })

                } catch (err) {
                    t.fail(`websocket proxy test failed: ${err.message}`)
                } finally {
                    proxyServer.close()
                    targetServer.close()
                    resolve()
                }
            })
        })
    })
        .then(() => t.end())
        .catch(err => {
            t.fail(err.toString())
            t.end()
        })
})

test('websocket proxy without proxy configuration', (t) => {
    new Promise((resolve) => {
        // Create http-server with websocket enabled but no proxy
        const server = httpServer.createServer({
            websocket: true,
            root: path.join(__dirname, 'fixtures')
        })

        server.listen(0, () => {
            try {
                // Test: Verify no upgrade event listener is registered when proxy is not set
                t.equal(server.server.listeners('upgrade').length, 0, 'no upgrade event listener should be registered when proxy is not set')
                t.pass('websocket option should be ignored when proxy is not configured')
            } catch (err) {
                t.fail(`test failed: ${err.message}`)
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

test('ensure websocket proxy is not enabled when \'websocket\' is not set', (t) => {
    new Promise((resolve) => {
        // Create a target server that will handle websocket connections
        const targetServer = http.createServer()
        const targetWss = new WebSocket.Server({ server: targetServer })

        targetWss.on('connection', (ws) => {
            ws.on('message', (message) => {
                // Echo the message back
                ws.send(`Echo: ${message}`)
            })
        })

        targetServer.listen(0, () => {
            const targetPort = targetServer.address().port
            const targetUrl = `http://localhost:${targetPort}`

            const proxyServer = httpServer.createServer({
                proxy: targetUrl,
                root: path.join(__dirname, 'fixtures')
            })
            try {
                t.equal(proxyServer.server.listeners('upgrade').length, 0, 'no upgrade event listener should be registered when websocket is not set')
            } catch (err) {
                t.fail(`test failed: ${err.message}`)
            } finally {
                proxyServer.close()
                targetServer.close()
                resolve()
            }
        })
    })
        .then(() => t.end())
        .catch(err => {
            t.fail(err.toString())
            t.end()
        })
});

test('websocket proxy error handling', (t) => {
    new Promise((resolve) => {
        // Create http-server with invalid proxy target
        const proxyServer = httpServer.createServer({
            proxy: 'http://localhost:99999', // Invalid port
            websocket: true,
            root: path.join(__dirname, 'fixtures')
        })

        proxyServer.listen(0, async () => {
            const proxyPort = proxyServer.server.address().port

            try {
                // Test: Verify websocket proxy handles connection errors gracefully
                t.ok(proxyServer.server.listeners('upgrade').length > 0, 'upgrade event listener should be registered even with invalid proxy')

                // Test websocket connection to invalid proxy target
                await new Promise((resolve, reject) => {
                    const ws = new WebSocket(`ws://localhost:${proxyPort}`)

                    ws.on('open', () => {
                        t.fail('websocket should not connect to invalid proxy target')
                        ws.close()
                        resolve()
                    })

                    ws.on('error', (err) => {
                        t.pass('websocket should error when proxy target is invalid')
                        resolve() // This is expected
                    })

                    ws.on('close', () => {
                        t.pass('websocket should close on error')
                        resolve()
                    })

                    setTimeout(() => {
                        ws.close()
                        resolve() // Timeout is acceptable for this test
                    }, 2000)
                })

            } catch (err) {
                t.fail(`websocket proxy error handling test failed: ${err.message}`)
            } finally {
                proxyServer.close()
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