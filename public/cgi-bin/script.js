#!/usr/bin/env node

// On Linux and Mac set this file to executable using:
// chmod +x script.js

console.log('Content-Type: text/plain')
console.log('');
console.log(`Hello, ${process.env.REMOTE_ADDR}!`);
