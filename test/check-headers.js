const request = require('request');

module.exports = (t, server, path, check) => {
  server.listen(() => {
    const port = server.address().port;
    const uri = `http://localhost:${port}/${path}`;

    request.get({ uri }, (err, res) => {
      t.ifError(err);
      t.equal(res.statusCode, 200);
      check(t, res.headers);
    });
  });
  t.once('end', () => {
    server.close();
  });
}
