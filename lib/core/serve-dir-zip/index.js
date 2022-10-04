'use strict';

const fs = require('fs');
const path = require('path');
const etag = require('../etag');
const url = require('url');
const status = require('../status-handlers');
const archiver = require('archiver');

module.exports = (opts) => {
  // opts are parsed by opts.js, defaults already applied
  const cache = opts.cache;
  const root = path.resolve(opts.root);
  const baseDir = opts.baseDir;
  const handleError = opts.handleError;
  const weakEtags = opts.weakEtags;

  return function middleware(req, res, next) {
    // Figure out the path for the directory from the given url
    const parsed = url.parse(req.url);
    const pathname = decodeURIComponent(parsed.pathname);
    
    // Remove the .zip extension and append a trailing slash
    const parsedPath = path.parse(pathname);
    const dirPath = `${path.join(parsedPath.dir, parsedPath.name)}/`;

    const dir = path.normalize(
      path.join(
        root,
        path.relative(
          path.join('/', baseDir),
          dirPath
        )
      )
    );

    fs.stat(dir, (statErr, stat) => {
      if (statErr) {
        if (handleError) {
          status[500](res, next, { error: statErr });
        } else {
          next();
        }
        return;
      }

      res.setHeader('content-type', 'application/zip');
      res.setHeader('etag', etag(stat, weakEtags));
      res.setHeader('last-modified', (new Date(stat.mtime)).toUTCString());
      res.setHeader('cache-control', cache);

      // Also supports .tar and .tar.gz archives
      const archive = archiver('zip', {
          zlib: { level: 9 } // Sets the compression level.
      });
      
      archive.on('warning', function(err) {
        if (err.code === 'ENOENT') {
          // Stat error or other potentially non-blocking error. For now, we just ignore it.
        } else {
          status['500'](res, next, { error: err });
        }
      });

      archive.on('error', function(err) {
        status['500'](res, next, { error: err });
      });

      archive.pipe(res);

      // This always excludes dotfiles
      archive.glob('**', { cwd: dir });

      archive.finalize();
    });
  };
};
