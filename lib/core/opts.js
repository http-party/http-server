'use strict';

// This is so you can have options aliasing and defaults in one place.

const defaults = require('./defaults.json');
const aliases = require('./aliases.json');

module.exports = (opts) => {
  let autoIndex = defaults.autoIndex;
  let showDir = defaults.showDir;
  let dirOverrides404 = defaults.dirOverrides404;
  let showDotfiles = defaults.showDotfiles;
  let humanReadable = defaults.humanReadable;
  let hidePermissions = defaults.hidePermissions;
  let si = defaults.si;
  let cache = defaults.cache;
  let gzip = defaults.gzip;
  let brotli = defaults.brotli;
  let forceContentEncoding = defaults.forceContentEncoding;
  let defaultExt = defaults.defaultExt;
  let handleError = defaults.handleError;
  const headers = {};
  let contentType = defaults.contentType;
  let mimeTypes;
  let weakEtags = defaults.weakEtags;
  let weakCompare = defaults.weakCompare;
  let handleOptionsMethod = defaults.handleOptionsMethod;

  function isDeclared(k) {
    return typeof opts[k] !== 'undefined' && opts[k] !== null;
  }

  function validateNoCRLF(str) {
    if (typeof str === 'string' && (str.includes('\r') || str.includes('\n'))) {
      throw new Error('Header is not a string or contains CRLF');
    }
  }

  function addHeader(key, value) {
    validateNoCRLF(key);
    validateNoCRLF(value);
    headers[key] = value;
  }

  function setHeader(str) {
    validateNoCRLF(str);
    
    const m = /^(.+?)\s*:\s*(.*)$/.exec(str);
    if (!m) {
      addHeader(str, true);  // Use addHeader instead of direct assignment
    } else {
      addHeader(m[1], m[2]); // Use addHeader instead of direct assignment
    }
  }


  if (opts) {
    aliases.autoIndex.some((k) => {
      if (isDeclared(k)) {
        autoIndex = opts[k];
        return true;
      }
      return false;
    });

    aliases.showDir.some((k) => {
      if (isDeclared(k)) {
        showDir = opts[k];
        return true;
      }
      return false;
    });

    aliases.dirOverrides404.some((k) => {
      if (isDeclared(k)) {
        dirOverrides404 = opts[k];
        return true;
      }
      return false;
    });

    aliases.showDotfiles.some((k) => {
      if (isDeclared(k)) {
        showDotfiles = opts[k];
        return true;
      }
      return false;
    });

    aliases.humanReadable.some((k) => {
      if (isDeclared(k)) {
        humanReadable = opts[k];
        return true;
      }
      return false;
    });

    aliases.hidePermissions.some((k) => {
      if (isDeclared(k)) {
        hidePermissions = opts[k];
        return true;
      }
      return false;
    });

    aliases.si.some((k) => {
      if (isDeclared(k)) {
        si = opts[k];
        return true;
      }
      return false;
    });

    if (opts.defaultExt && typeof opts.defaultExt === 'string') {
      defaultExt = opts.defaultExt;
    }

    if (typeof opts.cache !== 'undefined' && opts.cache !== null) {
      if (typeof opts.cache === 'string') {
        cache = opts.cache;
      } else if (typeof opts.cache === 'number') {
        cache = `max-age=${opts.cache}`;
      } else if (typeof opts.cache === 'function') {
        cache = opts.cache;
      }
    }

    if (typeof opts.gzip !== 'undefined' && opts.gzip !== null) {
      gzip = opts.gzip;
    }

    if (typeof opts.brotli !== 'undefined' && opts.brotli !== null) {
      brotli = opts.brotli;
    }
    if (typeof opts.forceContentEncoding !== 'undefined' && opts.forceContentEncoding !== null) {
      forceContentEncoding = opts.forceContentEncoding;
    }

    aliases.handleError.some((k) => {
      if (isDeclared(k)) {
        handleError = opts[k];
        return true;
      }
      return false;
    });

    aliases.coop.forEach((k) => {
      if (isDeclared(k) && opts[k]) {
        handleOptionsMethod = true;
        headers['Cross-Origin-Opener-Policy'] = 'same-origin';
        headers['Cross-Origin-Embedder-Policy'] = 'require-corp';
      }
    });

    aliases.cors.forEach((k) => {
      if (isDeclared(k) && opts[k]) {
        handleOptionsMethod = true;
        headers['Access-Control-Allow-Origin'] = '*';
        headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type, If-Match, If-Modified-Since, If-None-Match, If-Unmodified-Since';
      }
    });

    aliases.headers.forEach((k) => {
      if (isDeclared(k)) {
        if (Array.isArray(opts[k])) {
          opts[k].forEach(setHeader);
        } else if (opts[k] && typeof opts[k] === 'object') {
          Object.keys(opts[k]).forEach((key) => {
            addHeader(key, opts[k][key]);  // Uses same validation path
          });
        } else {
          setHeader(opts[k]);
        }
      }
    });

    aliases.contentType.some((k) => {
      if (isDeclared(k)) {
        contentType = opts[k];
        return true;
      }
      return false;
    });

    aliases.mimeType.some((k) => {
      if (isDeclared(k)) {
        mimeTypes = opts[k];
        return true;
      }
      return false;
    });

    aliases.weakEtags.some((k) => {
      if (isDeclared(k)) {
        weakEtags = opts[k];
        return true;
      }
      return false;
    });

    aliases.weakCompare.some((k) => {
      if (isDeclared(k)) {
        weakCompare = opts[k];
        return true;
      }
      return false;
    });

    aliases.handleOptionsMethod.some((k) => {
      if (isDeclared(k)) {
        handleOptionsMethod = handleOptionsMethod || opts[k];
        return true;
      }
      return false;
    });
  }

  return {
    cache,
    autoIndex,
    showDir,
    dirOverrides404,
    showDotfiles,
    humanReadable,
    hidePermissions,
    si,
    defaultExt,
    baseDir: (opts && opts.baseDir) || '/',
    gzip,
    brotli,
    forceContentEncoding,
    handleError,
    headers,
    contentType,
    mimeTypes,
    weakEtags,
    weakCompare,
    handleOptionsMethod,
  };
};
