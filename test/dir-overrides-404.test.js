'use strict';

const test = require('tap').test;
const http = require('http');
const ecstatic = require('../lib/core');
const request = require('request');
const showDir = require('../lib/core/show-dir');

const root = `${__dirname}/public/dir-overrides-404`;

test('server should display directory if -d and --dir-overrides--404 flags are specified', (t) => {
    // require('portfinder').getPort((err, port) => {
    try {
        const server = http.createServer(ecstatic({root, showDir: true, dirOverrides404: true}));
        // t.plan(2);
        // t.on('end', () => { server.close(); });
        server.listen(0, () => {
            const port = server.address().port;
            request.get(`http://localhost:${port}/directory/`, (err, res, body) => {
                if(err) {
                    t.error(err);
                }
                // console.log(body);
                // console.log(res.statusCode);
                t.equal(res.statusCode, 200);
                console.log(body);
                t.equal(body.includes('Index of /directory/'), true);
                server.close(() => { t.end(); });
            });
        })
        console.log('d');
        
    } catch (e) {
        t.fail(e.message);
        t.end();
    }
    // });
});

test('server should display 404.html if -d flag is specified but not --dir-overrides-404', (t) => {
    try {
        const server = http.createServer(ecstatic({root, showDir: true, dirOverrides404: false}));
        // t.plan(2);
        // t.on('end', () => { server.close(); });
        server.listen(0, () => {
            const port = server.address().port;
            request.get(`http://localhost:${port}/directory/`, (err, res, body) => {
                if(err) {
                    t.error(err);
                }
                t.equal(res.statusCode, 404);
                t.equal(body.includes('404file'), true);
                server.close(() => { t.end(); });
            });
        })
        console.log('d');
        
    } catch (e) {
        t.fail(e.message);
        t.end();
    }
    
});