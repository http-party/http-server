[![build status](https://img.shields.io/travis/DKurilo/http-server-spa-e2e.svg?style=flat-square)](https://travis-ci.org/DKurilo/http-server-spa-e2e/)
[![dependencies status](https://img.shields.io/david/DKurilo/http-server-spa-e2e.svg?style=flat-square)](https://david-dm.org/DKurilo/http-server-spa-e2e)
[![npm](https://img.shields.io/npm/v/http-server-spa-e2e.svg?style=flat-square)](https://www.npmjs.com/package/http-server-spa-e2e)
[![license](https://img.shields.io/github/license/DKurilo/http-server-spa-e2e.svg?style=flat-square)](https://github.com/DKurilo/http-server-spa-e2e)

# http-server-spa-e2e: a command-line http server with SPA support

This is modification for http-server that allow to serve single page applications. Developed for e2e testing.

If I understand correctly it will never be merged, so I registered it on npm and you can install it like:

`npm install http-server-spa-e2e`

`http-server` is a simple, zero-configuration command-line http server.  It is powerful enough for production usage, but it's simple and hackable enough to be used for testing, local development, and learning.

![](https://github.com/nodeapps/http-server/raw/master/screenshots/public.png)

# Installing globally:

Installation via `npm`:

     npm install http-server-spa-e2e -g

This will install `http-server` globally so that it may be run from the command line.

## Usage:

     http-server [path] [options]

`[path]` defaults to `./public` if the folder exists, and `./` otherwise.

*Now you can visit http://localhost:8080 to view your server*

## Available Options:

`-p` Port to use (defaults to 8080)

`-a` Address to use (defaults to 0.0.0.0)

`-d` Show directory listings (defaults to 'True')

`-i` Display autoIndex (defaults to 'True')

`-g` or `--gzip` When enabled (defaults to 'False') it will serve `./public/some-file.js.gz` in place of `./public/some-file.js` when a gzipped version of the file exists and the request accepts gzip encoding.

`-e` or `--ext` Default file extension if none supplied (defaults to 'html')

`-s` or `--silent` Suppress log messages from output

`--cors` Enable CORS via the `Access-Control-Allow-Origin` header

`-o` Open browser window after starting the server

`-c` Set cache time (in seconds) for cache-control max-age header, e.g. -c10 for 10 seconds (defaults to '3600'). To disable caching, use -c-1.

`-U` or `--utc` Use UTC time format in log messages.

`-P` or `--proxy` Proxies all requests which can't be resolved locally to the given url. e.g.: -P http://someurl.com

`-S` or `--ssl` Enable https.

`-C` or `--cert` Path to ssl cert file (default: cert.pem).

`-K` or `--key` Path to ssl key file (default: key.pem).

`-r` or `--robots` Provide a /robots.txt (whose content defaults to 'User-agent: *\nDisallow: /').

`-h` or `--help` Print this list and exit.

`-F` or `--fallback` 404 serves from the given file (relative to [path]). Doesn\'t work simultaneously with proxy

# Development

Checkout this repository locally, then:

```sh
$ npm i
$ node bin/http-server
```

*Now you can visit http://localhost:8080 to view your server*

You should see the turtle image in the screenshot above hosted at that URL. See
the `./public` folder for demo content.
