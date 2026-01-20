'use strict';

const aliases = require('./aliases.json');


/**
 * @typedef {Object} ParsedOptions
 * @property {boolean} autoIndex
 * @property {boolean} showDir
 * @property {boolean} dirOverrides404
 * @property {boolean} showDotfiles
 * @property {boolean} humanReadable
 * @property {boolean} hidePermissions
 * @property {boolean} si
 * @property {string|function} cache
 * @property {string} defaultExt
 * @property {string} baseDir
 * @property {boolean} gzip
 * @property {boolean} brotli
 * @property {boolean} forceContentEncoding
 * @property {function} handleError
 * @property {Object.<string, string|boolean>} headers
 * @property {string} contentType
 * @property {Object|undefined} mimeTypes
 * @property {boolean} weakEtags
 * @property {boolean} weakCompare
 * @property {boolean} handleOptionsMethod
 */


/**
* Converts a user-provided options object into a ParsedOptions object
* @param {object} opts - User provided options
* @returns {ParsedOptions}
*/
module.exports = (opts) => {
  /** @type {ParsedOptions} */
  const options = {
    autoIndex: true,
    showDir: true,
    dirOverrides404: false,
    showDotfiles: true,
    humanReadable: true,
    hidePermissions: false,
    si: false,
    cache: "max-age=3600",
    coop: false,
    cors: false,
    privateNetworkAccess: false,
    gzip: true,
    brotli: false,
    forceContentEncoding: false,
    defaultExt: "html",
    baseDir: "/",
    handleError: true,
    contentType: "application/octet-stream",
    weakEtags: true,
    weakCompare: true,
    handleOptionsMethod: false,
    headers: {},
    mimeTypes: undefined,
  };

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
    options.headers[key] = value;
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
        options.autoIndex = opts[k];
        return true;
      }
      return false;
    });

    aliases.showDir.some((k) => {
      if (isDeclared(k)) {
        options.showDir = opts[k];
        return true;
      }
      return false;
    });

    aliases.dirOverrides404.some((k) => {
      if (isDeclared(k)) {
        options.dirOverrides404 = opts[k];
        return true;
      }
      return false;
    });

    aliases.showDotfiles.some((k) => {
      if (isDeclared(k)) {
        options.showDotfiles = opts[k];
        return true;
      }
      return false;
    });

    aliases.humanReadable.some((k) => {
      if (isDeclared(k)) {
        options.humanReadable = opts[k];
        return true;
      }
      return false;
    });

    aliases.hidePermissions.some((k) => {
      if (isDeclared(k)) {
        options.hidePermissions = opts[k];
        return true;
      }
      return false;
    });

    aliases.si.some((k) => {
      if (isDeclared(k)) {
        options.si = opts[k];
        return true;
      }
      return false;
    });

    if (opts.defaultExt && typeof opts.defaultExt === 'string') {
      let ext = opts.defaultExt;
      // Remove the leading dot if it exists
      if (/^\./.test(ext)) {
        ext = ext.replace(/^\./, '');
      }
      options.defaultExt = ext;
    }

    if (typeof opts.cache !== 'undefined' && opts.cache !== null) {
      if (typeof opts.cache === 'string') {
        options.cache = opts.cache;
      } else if (typeof opts.cache === 'number') {
        options.cache = `max-age=${opts.cache}`;
      } else if (typeof opts.cache === 'function') {
        options.cache = opts.cache;
      }
    }

    if (typeof opts.gzip !== 'undefined' && opts.gzip !== null) {
      options.gzip = opts.gzip;
    }

    if (typeof opts.brotli !== 'undefined' && opts.brotli !== null) {
      options.brotli = opts.brotli;
    }
    if (typeof opts.forceContentEncoding !== 'undefined' && opts.forceContentEncoding !== null) {
      options.forceContentEncoding = opts.forceContentEncoding;
    }

    if (typeof opts.baseDir !== 'undefined' && opts.baseDir !== null) {
      options.baseDir = opts.baseDir;
    }

    aliases.handleError.some((k) => {
      if (isDeclared(k)) {
        options.handleError = opts[k];
        return true;
      }
      return false;
    });

    aliases.coop.forEach((k) => {
      if (isDeclared(k) && opts[k]) {
        options.handleOptionsMethod = true;
        options.headers['Cross-Origin-Opener-Policy'] = 'same-origin';
        options.headers['Cross-Origin-Embedder-Policy'] = 'require-corp';
      }
    });

    aliases.cors.forEach((k) => {
      if (isDeclared(k) && opts[k]) {
        options.handleOptionsMethod = true;
        options.headers['Access-Control-Allow-Origin'] = '*';
        options.headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type, If-Match, If-Modified-Since, If-None-Match, If-Unmodified-Since';
      }
    });

    aliases.privateNetworkAccess.forEach((k) => {
      if (isDeclared(k) && opts[k]) {
        options.headers['Access-Control-Allow-Private-Network'] = 'true';
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
        options.contentType = opts[k];
        return true;
      }
      return false;
    });

    aliases.mimeType.some((k) => {
      if (isDeclared(k)) {
        options.mimeTypes = opts[k];
        return true;
      }
      return false;
    });

    aliases.weakEtags.some((k) => {
      if (isDeclared(k)) {
        options.weakEtags = opts[k];
        return true;
      }
      return false;
    });

    aliases.weakCompare.some((k) => {
      if (isDeclared(k)) {
        options.weakCompare = opts[k];
        return true;
      }
      return false;
    });

    aliases.handleOptionsMethod.some((k) => {
      if (isDeclared(k)) {
        options.handleOptionsMethod = options.handleOptionsMethod || opts[k];
        return true;
      }
      return false;
    });
  }

  return options;
};
