
var fs = require('fs'),
    path = require('path');

function webpack (req, res) {
    if (req.url.search(/\./) === -1) {
        return res.end(fs.readFileSync(path.join(process.cwd(), 'index.html')));
    }
    res.emit('next');
}
module.exports = webpack;

