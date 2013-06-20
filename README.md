/* REV EDIT */

`http-server-cgi` extends [nodeapps/http-server](http://github.com/nodeapps/http-server) to support CGI scripts written in Perl. The script file must have the '.cgi' extension and be placed either in the root directy where `http-server` is invoked, or in the subdirectories 'cgi', 'cgi-bin' or 'scripts'. Perl is invoked with the -T switch (taint mode), so query parameters must be cleaned by regex before being assigned to variables in the script. 

Right now this is all handled by an anonymous function and the only request methods supported are "GET" and "POST". The enctype "multipart/form-data" is NOT supported. Eventually I may replace this function with [Express](http://expressjs.com/), then I will be able to test and support "multipart/form-data" (i.e. file uploads).

/* END EDIT */

# http-server: a command-line http server

`http-server` is a simple, zero-configuration command-line http server.  It is powerful enough for production usage, but it's simple and hackable enough to be used for testing, local development, and learning.

![](https://github.com/nodeapps/http-server/raw/master/screenshots/public.png)

# Installing globally:

Installation via `npm`.  If you don't have `npm` yet:

     curl http://npmjs.org/install.sh | sh
     
Once you have `npm`:

     npm install http-server -g
     
This will install `http-server` globally so that it may be run from the command line.

## Usage:

     http-server [path] [options]

`[path]` defaults to `./public` if the folder exists, and `./` otherwise.

# Installing as a node app

     mkdir myapp
     cd myapp/
     jitsu install http-server

*If you do not have `jitsu` installed you can install it via `npm install jitsu -g`*

## Usage

### Starting http-server locally

     node bin/http-server

*Now you can visit http://localhost:8080 to view your server*

### Deploy http-server to nodejitsu

     jitsu deploy

*You will now be prompted for a `subdomain` to deploy your application on*

## Available Options:

`-p` Port to listen for connections on (defaults to 8080)

`-a` Address to bind to (defaults to '0.0.0.0')

`-i` Display autoIndex (defaults to 'True')

`-e` or `--ext` Default file extension (defaults to 'html')

`-s` or `--silent` In silent mode, log messages aren't logged to the console.

`-h` or `--help` Displays a list of commands and exits.

`-c` Set cache time (in seconds) for cache-control max-age header, e.g. -c10 for 10 seconds. To disable caching, use -c-1.
