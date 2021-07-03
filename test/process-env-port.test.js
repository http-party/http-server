'use strict';

const test = require('tap').test;
const request = require('request');
const spawn = require('child_process').spawn;

function getRandomInt(min, max) {
  return Math.floor((Math.random() * ((max - min) + 1))) + min;
}

const sanePort = getRandomInt(1025, 65536);
const floatingPointPort = 9090.86;
const insanePorts = [-1, 65537];

function checkServerIsRunning(url, msg, ps, t) {
 if (!msg.toString().match(/Starting up/)) {
    return;
  }
  t.pass('http-server was started');
  request(url, (err, res) => {
    if (!err && res.statusCode !== 500) {
      t.pass('a successful request from the server was made');
    } else {
      t.fail('the server could not be reached');
    }
    ps.kill('SIGTERM');
  });
}

function startServer(url, port, t) {
  const ecstatic = spawn(process.execPath, [require.resolve('../bin/http-server')], {
    env: {
      PORT: String(port),
    },
  });

  if (!insanePorts.includes(port)) {
    ecstatic.stdout.on('data', (msg) => {
      checkServerIsRunning(url, msg, ecstatic, t);
    });
  } else {
    ecstatic.on('exit', (evt) => {
         t.notEqual(evt.code, 0, 'err:Running on invalid port not allowed');
    });
  }
}

test('sane port', (t) => {
  t.plan(2);
  startServer(`http://127.0.0.1:${sanePort}`, sanePort, t);
});

test('floating point port', (t) => {
  t.plan(2);
  startServer('http://127.0.0.1:9090', floatingPointPort, t);
});

insanePorts.forEach((port) => {
  test(`insane port: ${port}`, (t) => {
    t.plan(1);
    startServer('http://127.0.0.1:8000', port, t);
  });
});

