# node-http-server: command-line static web server for node.js

`http-server` is a simple, no-configuration command-line static web server.  It can be used for anything from simple learning and testing to full production use serving static web content.

Installation is via `npm`.  If you don't have `npm` yet:

     curl http://npmjs.org/install.sh | sh
     
Once you have `npm`:

     npm install http-server -g
     
This will install `http-server` globally so that it may be run from the command line.  Now try:

     http-server /mypath
     
The entire /mypath tree will now be available at `http://localhost:8080/`.  

## Usage:

     http-server [path] [options]

Available options:

`-p` Port to listen for connections on (defaults to 8080)

`-a` Address to bind to (defaults to 'localhost')

`-s` or `--silent` In silent mode, log messages aren't logged to the console.

`-h` or `--help` Displays a list of commands and exits.


