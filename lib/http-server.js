var fs = require('fs'),
    util = require('util'),
    union = require('union'),
    ecstatic = require('ecstatic'),
	fs = require('fs'),
	path = require('path'),
	qs = require('querystring');
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
		/* REV EDIT */
		console.log( "url: "+ req['url'] +"\n");
		if( req['url'].match(/\.cgi/) !== null ) {
			process.cgi_res = res;
			var old_dir = process.cwd();
			var dir = req['url'].match(/(cgi|cgi-bin|scripts)\/[\w|-]+\.cgi/);
		    var script; 
			dir = ( dir !== null )? './'+ dir[1] + '/' : './';
			if( fs.existsSync(dir) ) {
				script = path.resolve( dir, req['url'].match(/[\w|-]+\.cgi/)[0] );
				console.log( dir +"exists ? "+ fs.existsSync(dir) );
				process.chdir(dir); 
			} else {
				old_dir = '.';
				script = path.resolve( dir, req['url'].match(/[\w|-]+\.cgi/)[0] );
			}
			console.log( "Current dir: "+ process.cwd() );
			console.log( script );
			console.log( req.method );
			var q = '', body = '';
			if (req.method == 'POST') {
			
				req.on('data', function (data) {
					//console.log(data);
					body += data;
				});
				
				req.on('end', function () {
					var script_args = '';
					q = qs.parse(body);
					//q = body;
					process.env['QUERY_STRING'] = q;
					for( var qparts in q ) {
						if( (qparts.match(/multipart\/form-data/) !== null) ||
							(q[qparts].toString().match(/multipart\/form-data/) !== null) ){
							process.cgi_res.writeHead(200, {
								'Content-Length': stdout.length,
								'Content-Type': "text/html"
							});
							console.log( "multipart/form-data is NOT supported" );
							process.cgi_res.end( "multipart/form-data is NOT supported" );
							return false;
						}
						script_args += ' '+ qparts +"="+ ( (!q[qparts]) ? "_" : q[qparts] );
					}
					script_args = script_args.replace( /"/g, '"\\\"' );
					script = 'perl -T '+ script +' '+ script_args;
					console.log(script +"\n");
					
					var prc = exec( script,
						function( err, stdout, stderr ) {
							console.log(stdout);
							if(stdout) {
								var rgx = /[C|c]ontent-[T|t]ype\:\s([\w|\+|-|\/]+).*[\n|\r|\f]+/;
								var content_type = stdout.match( rgx );
								if( content_type !== null ) {
									content_type = content_type[1];
									stdout = stdout.replace( rgx, '' );
									stdout = stdout.replace( 
										/[S|s]tatus\:.*[\n|\r|\f]+/, 
										'' 
									);
								} else content_type = 'text/plain';
								process.cgi_res.writeHead(200, {
									'Content-Length': stdout.length,
									'Content-Type': content_type
								});
								process.cgi_res.end( stdout );
							}
							if(stderr) {
								console.log( "CGI warnings...\n"+ stderr);
								process.cgi_res.end( stderr );
							}
							if( err !== null ) {
								console.log( "CGI errors...\n"+ err );
								process.cgi_res.end( err );
							}
						}
					);
				} );
				
			} else {
				q = req['url'].match(/[\w|-]+\.cgi\?(.+)/);
				process.env['QUERY_STRING'] = (q !== null) ? q[1] : '';
				q = (q !== null) ? q[1].split("&") : [];
			
				var query = {};
				for(var i=0, z=q.length; i<z; i++) {
					var qkeys = q[i].split("=")[0];
					var qvalues = q[i].split("=")[1];
					query[qkeys] = qvalues;
					script += " "+ q[i];
				}
				console.log(script +"\n");
				var prc = exec( 'perl -T '+ script,
					function( err, stdout, stderr ) {
						console.log(stdout);
						if(stdout) {
							var rgx = /[C|c]ontent-[T|t]ype\:\s([\w|\+|-|\/]+).*[\n|\r|\f]+/;
							var content_type = stdout.match( rgx );
							if( content_type !== null ) {
								content_type = content_type[1];
								stdout = stdout.replace( rgx, '' );
								stdout = stdout.replace( 
									/[S|s]tatus\:.*[\n|\r|\f]+/, 
									'' 
								);
							} else content_type = 'text/plain';
							process.cgi_res.writeHead(200, {
								'Content-Length': stdout.length,
								'Content-Type': content_type
							});
							process.cgi_res.end( stdout );
						}
						if(stderr) {
							console.log( "CGI warnings...\n"+ stderr);
							process.cgi_res.end( stderr );
						}
						if( err !== null ) {
							console.log( "CGI errors...\n"+ err );
							process.cgi_res.end( err );
						}
					}
				);
			}
			process.chdir(old_dir);
		} else res.emit('next');
		/* END EDIT */
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
