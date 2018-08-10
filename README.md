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

## Usage:

     http-server [path] [options]

`[path]` defaults to `./public` if the folder exists, and `./` otherwise.

*Now you can visit http://localhost:8080 to view your server*

**Note:** Caching is on by default. Add `-c-1` as an option to disable caching.

## Available Options:

`-p` Port to use (defaults to 8080)

`-a` Address to use (defaults to 0.0.0.0)

`-d` Show directory listings (defaults to `true`)

`-i` Display autoIndex (defaults to `true`)

`-g` or `--gzip` When enabled (defaults to `false`) it will serve `./public/some-file.js.gz` in place of `./public/some-file.js` when a gzipped version of the file exists and the request accepts gzip encoding.

`-e` or `--ext` Default file extension if none supplied (defaults to `html`)

`-s` or `--silent` Suppress log messages from output

`--cors` Enable CORS via the `Access-Control-Allow-Origin` header

`-o` Open browser window after starting the server

`-c` Set cache time (in seconds) for cache-control max-age header, e.g. `-c10` for 10 seconds (defaults to `3600`). To disable caching, use `-c-1`.

`-U` or `--utc` Use UTC time format in log messages.

`-P` or `--proxy` Proxies all requests which can't be resolved locally to the given url. e.g.: -P http://someurl.com

`-S` or `--ssl` Enable https.

`-C` or `--cert` Path to ssl cert file (default: `cert.pem`).

`-K` or `--key` Path to ssl key file (default: `key.pem`).

`-r` or `--robots` Provide a /robots.txt (whose content defaults to `User-agent: *\nDisallow: /`)

`-h` or `--help` Print this list and exit.

## Headers

An optional file called `headers.json` may be placed in the root path (as specified by the [path] argument) being
served.  If this file is present, the contents are used to add headers to the server response.  Request paths can be
added to the json file with an array of objects that contain information about the headers to add.

The `headers.json` file follows this format:
```
{
  "Path to Match": [
    {"header": "Name of the header to add", "value": "value of header", "append": true/false},
    {"header": "Second header on same path", "value": "value of header", "append": true/false}
  ],
  "Second Path to match": [
    {"header": "Name of the header to add", "value": "value of header", "append": true/false}
  ]
}
```

Notes about the `headers.json` file:
- "Path to match" uses [minimatch](https://www.npmjs.com/package/minimatch) to match to the request.  For example,
  an entry for `/**` would match all requests.
- The headers are added in the order they appear in the file.  Unless `append` is set to true, previous values will
  be overwritten
- `append` is optional.  If not present, or set to false, a matched header will be overwritten.  If set to true,
  the value specified will be appended to the existing header value separated by a comma (,) and a space as
  specified [here](https://tools.ietf.org/html/rfc7230#section-3.2).
- Headers added with this file will be added/set AFTER headers set by command line arguments.  This will allow you
  to selectively override/change headers set at http-server startup.


## Magic Files

- `index.html` will be served as the default file to any directory requests.
- `404.html` will be served if a file is not found. This can be used for Single-Page App (SPA) hosting to serve the entry page.
- `headers.json` will be read (if present) and used to add headers to the response.

# Development

Checkout this repository locally, then:

```sh
$ npm i
$ node bin/http-server
```

*Now you can visit http://localhost:8080 to view your server*

You should see the turtle image in the screenshot above hosted at that URL. See
the `./public` folder for demo content.
