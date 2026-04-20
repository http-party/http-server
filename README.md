# Secure HTTP Server Lite

## Overview

This project is a lightweight reimplementation of core functionalities from http-server, with additional security enhancements.

## Features

* Static file serving
* Safe path resolution
* Basic MIME type support

## Security Enhancements

* Path traversal protection
* Secure HTTP headers
* Access logging for audit

## Motivation

Existing lightweight HTTP servers often lack built-in security protections. This project aims to improve security and auditability while keeping the implementation minimal.

## Usage

```bash
node bin/http-server ./public
```

### Programmatic usage

```js
const { createServer } = require('./lib/http-server');

const server = createServer({
	root: './public',
	securityHeaders: true,
	accessLog: true,
});

server.listen(8080);
```

## Future Work

* Add HTTPS support
* Add rate limiting
* Improve MIME detection
