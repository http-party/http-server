#!/usr/bin/env node

console.log('Content-Type: text/plain');
console.log('');
console.log(`Hello, ${process.env.REMOTE_ADDR}!`);
console.log('');

for (var v in process.env) {
  console.log(v, process.env[v]);
}
