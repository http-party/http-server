'use strict';

module.exports = function lastModifiedToString(stat) {
  if (!stat.mtime) {
    // stat error (eg, broken symlink)
    return 'Unknown Date';
  }
  const t = new Date(stat.mtime);
  return (('0' + (t.getDate())).slice(-2) + '-' +
          t.toLocaleString('default', { month: 'short' }) + '-' +
          t.getFullYear() + ' ' +
          ('0' + t.getHours()).slice(-2) + ':' +
          ('0' + t.getMinutes()).slice(-2));
};
