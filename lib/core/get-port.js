const portfinder = require('portfinder');

exports.getPort = function (basePort) {
  return new Promise((resolve, reject) => {
    portfinder.basePort = basePort || 8080;
    portfinder.getPort(function (err, port) {
      if (err) {
        reject(err);
      } else {
        resolve(port);
      }
    });
  });
}