# http-server: command-line node.js static web server

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

      -p Port to use [8080]
      -a Address to use [localhost]
      -s --silent Suppress log messages from output
      -h --help Print this list and exit.

