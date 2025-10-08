'use strict';

const styles = require('./styles');
const lastModifiedToString = require('./last-modified-to-string');
const permsToString = require('./perms-to-string');
const sizeToString = require('./size-to-string');
const sortFiles = require('./sort-files');
const fs = require('fs');
const path = require('path');
const he = require('he');
const etag = require('../etag');
const url = require('url');
const status = require('../status-handlers');

const supportedIcons = styles.icons;
const css = styles.css;

module.exports = (opts) => {
  // opts are parsed by opts.js, defaults already applied
  const cache = opts.cache;
  const root = path.resolve(opts.root);
  const baseDir = opts.baseDir;
  const humanReadable = opts.humanReadable;
  const hidePermissions = opts.hidePermissions;
  const handleError = opts.handleError;
  const showDotfiles = opts.showDotfiles;
  const si = opts.si;
  const weakEtags = opts.weakEtags;

  return function middleware(req, res, next) {
    // Figure out the path for the file from the given url
    const parsed = url.parse(req.url);
    const pathname = decodeURIComponent(parsed.pathname);
    const dir = path.normalize(
      path.join(
        root,
        path.relative(
          path.join('/', baseDir),
          pathname
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

      // files are the listing of dir
      fs.readdir(dir, (readErr, _files) => {
        let files = _files;

        if (readErr) {
          if (handleError) {
            status[500](res, next, { error: readErr });
          } else {
            next();
          }
          return;
        }

        // Optionally exclude dotfiles from directory listing.
        if (!showDotfiles) {
          files = files.filter(filename => filename.slice(0, 1) !== '.');
        }

        res.setHeader('content-type', 'text/html');
        res.setHeader('etag', etag(stat, weakEtags));
        res.setHeader('last-modified', (new Date(stat.mtime)).toUTCString());
        res.setHeader('cache-control', cache);
        
        // A step before render() is called to gives items additional
        // information so that render() can deliver the best user experience
        // possible.
        function process(dirs, renderFiles, lolwuts) {
          const filenamesThatExist = new Set();

          // Putting filenames in a set first keeps us in O(n) time complexity
          for (let i=0; i < renderFiles.length; i++) {
            const [name, stat] = renderFiles[i];
            filenamesThatExist.add(name);
            const renderOptions = {};
            renderFiles[i] = [name, stat, renderOptions];
          }
          
          // Set render options for compressed files
          for (const [name, _stat, renderOptions] of renderFiles) {
            if (
              opts.brotli &&
              ! opts.forceContentEncoding &&
              name.endsWith('.br')
            ) {
              const uncompressedName = name.slice(0, -'.br'.length);
              if (filenamesThatExist.has(uncompressedName)) {
                continue;
              }
              renderOptions.uncompressedName = uncompressedName;
            }
          }
          for (const [name, _stat, renderOptions] of renderFiles) {
            if (
              opts.gzip &&
              ! opts.forceContentEncoding &&
              name.endsWith('.gz')
            ) {
              const uncompressedName = name.slice(0, -'.gz'.length);
              if (filenamesThatExist.has(uncompressedName)) {
                continue;
              }
              renderOptions.uncompressedName = uncompressedName;
            }
          }
          render(dirs, renderFiles, lolwuts);
        }

        function render(dirs, renderFiles, lolwuts) {
          // each entry in the array is a [name, stat] tuple

          let html = `${[
            '<!doctype html>',
            '<html>',
            '  <head>',
            '    <meta charset="utf-8">',
            '    <meta name="viewport" content="width=device-width">',
            `    <title>Index of ${he.encode(pathname)}</title>`,
            `    <style type="text/css">${css}</style>`,
            '  </head>',
            '  <body>',
            `<h1>Index of ${he.encode(pathname)}</h1>`,
          ].join('\n')}\n`;

          html += '<table>';

          const failed = false;
          const writeRow = (file) => {
            // render a row given a [name, stat, renderOptions] tuple
            const isDir = file[1].isDirectory && file[1].isDirectory();
            let href = `./${encodeURIComponent(file[0])}`;

            // append trailing slash and query for dir entry
            if (isDir) {
              href += `/${he.encode((parsed.search) ? parsed.search : '')}`;
            }

            // Handle compressed files with uncompressed names
            let displayNameHTML;
            let fileSize = sizeToString(file[1], humanReadable, si);
            
            if (file[2] && file[2].uncompressedName) {
              // This is a compressed file, show both names with separate links
              const uncompressedName = he.encode(file[2].uncompressedName);
              const compressedName = he.encode(file[0]);
              const uncompressedHref = `./${encodeURIComponent(file[2].uncompressedName)}`;
              const asterisk = `<span title="served from compressed file">*</span>`;
              displayNameHTML = `<a href="${uncompressedHref}">${uncompressedName}</a>` +
                `${asterisk} (<a href="${href}">${compressedName}</a>)`;
              fileSize += '*';
            } else {
              // Regular file or directory
              displayNameHTML = `<a href="${href}">${he.encode(file[0]) + ((isDir) ? '/' : '')}</a>`;
            }

            const ext = file[0].split('.').pop();
            const classForNonDir = supportedIcons[ext] ? ext : '_page';
            const iconClass = `icon-${isDir ? '_blank' : classForNonDir}`;

            // TODO: use stylessheets?
            html += `${'<tr>' +
              '<td><i class="icon '}${iconClass}"></i></td>`;
            if (!hidePermissions) {
              html += `<td class="perms"><code>(${permsToString(file[1])})</code></td>`;
            }
            html +=
              `<td class="last-modified">${lastModifiedToString(file[1])}</td>` +
              `<td class="file-size"><code>${fileSize}</code></td>` +
              `<td class="display-name">${displayNameHTML}</td>` +
              '</tr>\n';
          };

          dirs.sort((a, b) => a[0].toString().localeCompare(b[0].toString())).forEach(writeRow);
          renderFiles.sort((a, b) => a.toString().localeCompare(b.toString())).forEach(writeRow);
          lolwuts.sort((a, b) => a[0].toString().localeCompare(b[0].toString())).forEach(writeRow);

          html += '</table>\n';
          html += `<br><address>Node.js ${
            process.version
            }/ <a href="https://github.com/http-party/http-server">http-server</a> ` +
            `server running @ ${
            he.encode(req.headers.host || '')}</address>\n` +
            '</body></html>'
          ;

          if (!failed) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
          }
        }

        sortFiles(dir, files, (lolwuts, dirs, sortedFiles) => {
          // It's possible to get stat errors for all sorts of reasons here.
          // Unfortunately, our two choices are to either bail completely,
          // or just truck along as though everything's cool. In this case,
          // I decided to just tack them on as "??!?" items along with dirs
          // and files.
          //
          // Whatever.

          // if it makes sense to, add a .. link
          if (path.resolve(dir, '..').slice(0, root.length) === root) {
            fs.stat(path.join(dir, '..'), (err, s) => {
              if (err) {
                if (handleError) {
                  status[500](res, next, { error: err });
                } else {
                  next();
                }
                return;
              }
              dirs.unshift(['..', s]);
              process(dirs, sortedFiles, lolwuts);
            });
          } else {
            process(dirs, sortedFiles, lolwuts);
          }
        });
      });
    });
  };
};
