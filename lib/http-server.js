var fs = require('fs'),
    util = require('util'),
    union = require('union'),
    ecstatic = require('ecstatic'),
	path = require('path'),
	exec = require('child_process').exec;

var HTTPServer = exports.HTTPServer = function (options) {
  options = options || {};

  if (options.root) {
    this.root = options.root;
  }
  else {
    try {
      fs.lstatSync('./public');
      this.root = './public';
    }
    catch (err) {
      this.root = './';
    }
  }
  
  if (options.headers) {
    this.headers = options.headers; 
  }

  this.cache = options.cache || 3600; // in seconds.
  this.autoIndex = options.autoIndex !== false;

  if (options.ext) {
    this.ext = options.ext === true
      ? 'html'
      : options.ext;
  }

  this.server = union.createServer({
    before: (options.before || []).concat([
	  function (req, res) {
		console.log( "url: "+ req['url'] );
		if( req['url'].match(/\.cgi/) !== null ) {
		    var script = path.resolve( './scripts/', req['url'].match(/[\w|-]+\.cgi/)[0] );
			var q = req['url'].match(/[\w|-]+\.cgi\?(.+)/)[1].split("&");
			var query = {};
			for(var i=0, z=q.length; i<z; i++) {
				var qkeys = q[i].split("=")[0];
				var qvalues = q[i].split("=")[1];
				query[qkeys] = qvalues;
				script += " "+ qvalues;
			}
			console.log(script);
			process.cgi_res = res;
			var prc = exec( 'perl '+ script,
				function( err, stdout, stderr ) {
					console.log(stdout);
					if(stdout) {
						var rgx = /Content-Type\:\s([\w|\+|-|\/]+)[\n|\r|\f]+/;
						var content_type = stdout.match( rgx );
						if( content_type !== null ) {
							content_type = content_type[1];
							stdout = stdout.replace( rgx, '' );
						} else content_type = 'text/plain';
						process.cgi_res.writeHead(200, {
							'Content-Length': stdout.length,
							'Content-Type': content_type
						});
						process.cgi_res.end( stdout );
					}
					if(stderr) {
						process.cgi_res.writeHead(200, {
							'Content-Length': stderr.length,
							'Content-Type': 'text/plain' 
						});
						process.cgi_res.end( stderr );
					}
					if( err !== null ) {
						console.log( "exec error: "+ err );
						process.cgi_res.end( err );
					}
				}
			);
		} else res.emit('next');
	  },
      ecstatic(this.root, {
        autoIndex: this.autoIndex,
        cache: this.cache,
        defaultExt: this.ext
      })
    ]),
    headers: this.headers || {}
  });
};

HTTPServer.prototype.listen = function () {
  this.server.listen.apply(this.server, arguments);
};

HTTPServer.prototype.close = function () {
  return this.server.close();
};

exports.createServer = function (options) {
  return new HTTPServer(options);
};
