module.exports = function (path) {
  return /.*file.*/.test(path) ? 5 : 30;
};
