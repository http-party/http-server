# node-http-server: command-line static web server for node.js

`http-server` is a simple, no-configuration command-line static web server.  It can be used for anything from simple learning and testing to full production use serving static web content.

Installation is via `npm`.  If you don't have `npm` yet:

     curl http://npmjs.org/install.sh | sh
     
Once you have `npm`:

     npm install http-server -g
     
This will install `http-server` globally so that it may be run from the command line.

## Usage:

     http-server [path] [options]

Example:

     avian@avian:~/web$ http-server ~/handbook -p 9000
     Starting up http-server, serving /home/avian/handbook on port: 9000
     http-server successfully started: localhost:9000
     Hit CTRL-C to stop the server 
     
The entire /mypath tree will now be available at `http://localhost:9000/`.  



## Available Options:

`-p` Port to listen for connections on (defaults to 8080)

`-a` Address to bind to (defaults to 'localhost')

`-s` or `--silent` In silent mode, log messages aren't logged to the console.

`-h` or `--help` Displays a list of commands and exits.


