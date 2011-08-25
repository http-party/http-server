# http-server: a command-line http server

`http-server` is a simple, zero-configuration command-line http server.  It is powerful enough for production usage, but it's simple and hackable enough to be used for testing, local development, and learning.

## Installation:

Installation is via `npm`.  If you don't have `npm` yet:

     curl http://npmjs.org/install.sh | sh
     
Once you have `npm`:

     npm install http-server -g
     
This will install `http-server` globally so that it may be run from the command line.


If you cannot install `npm`, you can always clone the source directly:

     git clone git://github.com/nodejitsu/http-server.git
     cd http-server
     node bin/http-server

## Usage:

     http-server [path] [options]

<img src="https://github.com/nodejitsu/http-server/raw/master/screenshots/start.png"/></img>
     
The entire /mypath tree will now be available at `http://localhost:8080/`.  

<img src="https://github.com/nodejitsu/http-server/raw/master/screenshots/directory.png"/></img>

## Available Options:

`-p` Port to listen for connections on (defaults to 8080)

`-a` Address to bind to (defaults to 'localhost')

`-i` Display autoIndex (defaults to 'True')

`-s` or `--silent` In silent mode, log messages aren't logged to the console.

`-h` or `--help` Displays a list of commands and exits.
