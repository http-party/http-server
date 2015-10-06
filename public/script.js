!(function (opts) {
	var doc=document;
	var head = document.head;
	var scriptUrl = opts.url || (opts.host || document.location.origin) + "/socket.io/socket.io.js";
	var tag = doc.createElement('script');
	tag.src=scriptUrl;
	tag.onload=function(){
		var socket = io(opts.host);
			var loop = true;
		window.socket=socket;
		socket.on('connected',function(data) {
			console.log('connected!');
		});
		socket.on('reload',function(data) {
			window.location.reload();
		});
		socket.on('changed',function(data) {
			console.log(data);
			var event = data.event;
			if (loop) {
				loop = false;
				if (opts.wait1sec)
				{
					setTimeout(function(){
						loop = true;
					},1000);
				}
				switch(event) {
					case 'NewFile':
					case 'Removed':
					break;
					case 'Changed':
						if( opts.confirm || confirm('Some files have been modified！Reload ?')) {
							window.location.reload();
						}
					break;
				}
			}
		});
	}
	head.appendChild(tag);
})(liveOpts||{})
/*
var liveOpts ={
	url:"http://127.0.0.1:8080/socket.io/socket.io.js",
	host:"http://127.0.0.1:8080",
	confirm:true,
	wait1sec:true
}

*/