---
tags: [Import-2dec]
title: README
created: '2019-04-19T04:04:47.383Z'
modified: '2019-04-19T04:19:42.487Z'
---

[![build status](https://img.shields.io/travis/indexzero/http-server.svg?style=flat-square)](https://travis-ci.org/indexzero/http-server)
[![dependencies status](https://img.shields.io/david/indexzero/http-server.svg?style=flat-square)](https://david-dm.org/indexzero/http-server)
[![npm](https://img.shields.io/npm/v/http-server.svg?style=flat-square)](https://www.npmjs.com/package/http-server)
[![license](https://img.shields.io/github/license/indexzero/http-server.svg?style=flat-square)](https://github.com/indexzero/http-server)

# http-server: a command-line http server

`http-server` is a simple, zero-configuration command-line http server.  It is powerful enough for production usage, but it's simple and hackable enough to be used for testing, local development, and learning.

![](https://github.com/nodeapps/http-server/raw/master/screenshots/public.png)

# Installing globally:

Installation via `npm`:

     npm install http-server -g

This will install `http-server` globally so that it may be run from the command line.

## Running on-demand:

Using `npx` you can run the script without installing it first:

     npx http-server [path] [options]

## Usage:

     http-server [path] [options]

`[path]` defaults to `./public` if the folder exists, and `./` otherwise.

*Now you can visit http://localhost:8080 to view your server*

**Note:** Caching is on by default. Add `-c-1` as an option to disable caching.

## Available Options:

| Argument          | What it does            | Default Value | Notes |
| ----------------- | ----------------------- | ------------- | ----- |
| `-p` or `--port`  | Port to use             | 8080          | |
| `-a`              | Address to use          | 0.0.0.0       | |
| `-d`              | Show directory listings | `true`        | |
| `-i`              | Display autoIndex       | `true`        | |
| `-g` or `--gzip`  | Serve gzipped version   | `false`       | Serve `./public/some-file.js.jz` in place of `./public/some-file.js` if it exists. If `brotli` is enabled, it will try to serve brotli first. |
| `-b` or `--brotli`| Serve brotli version    | `false`       | Serve `./public/some-file.js.br` in place of `./public/some-file.js` if it exists. If `gzip` is enabled, it will try to serve brotli first. |
| `-e`              | Default file extension  | `html`        | |
| `-s` or `--silent`| Suppress log messages   | | |
| `--cors`          | Enable CORS via the `Access-Control-Allow-Origin` Header | | |
| `-o [path]`       | Open a browser window to specified path after server starts. | | Optionally, provide a path for the browser to open, e.g.: `-o /other/dir` |
| `-c`              | Set cache time (in seconds) | `3600` | e.g. `-c10` for 10 seconds. To disable caching, use `-c-1`. This uses the `Cache-Control Max-Age` header. |
| `-U` or `--utc`   | Use UTC time format in logs. | | |
| `--log-ip`        | Enable logging of client IP address. | `false` | |
| `-P` or `--proxy` | Proxies all requests that can't be resolved locally to the given URL. | | e.g.: `-P http://someurl.com` |
| `--username`      | Username, for basic authentication. | | |
| `--password`      | Password, for basic authentication. | | |
| `-S` or `--ssl`   | Enable HTTPS. | | |
| `-C` or `--cert`  | Path to SSL certificate file. | `cert.pem` | |
| `-K` or `--key`   | Path to SSL private key file. | `key.pem`  | |
| `-r` or `--robots`| Provide a `/robots.txt`. | Content defaults to `User-agent: *\nDisallow: /`. | |
| `-h` or `--help`  | Print this argument list. | | |


## Magic Files

- `index.html` will be served as the default file to any directory requests.
- `404.html` will be served if a file is not found. This can be used for Single-Page App (SPA) hosting to serve the entry page.

# Development

Checkout this repository locally, then:

```sh
$ npm i
$ node bin/http-server
```

*Now you can visit http://localhost:8080 to view your server*

You should see the turtle image in the screenshot above hosted at that URL. See
the `./public` folder for demo content.

