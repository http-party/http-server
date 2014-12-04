var fs = require('fs'),
    union = require('union'),
    ecstatic = require('ecstatic');

var HTTPServer = exports.HTTPServer = function (options) {
    this.init.apply(this, arguments);
};

HTTPServer.prototype = {
    init : function(options){
        this.create(options || {});
    },

    checkDirExistence : function(dir) {
        try { fs.lstatSync(dir); return true }
        catch (er) { return false }
    },

    getRootDir : function(){
        return this.root;
    },

    create : function (options){
        this.root = options.root || (this.checkDirExistence('./public') ? './public' : './');

        var ecsOptions = {
            root : this.root,
            cache : options.cache || 3600,  // in seconds.
            showDir : options.showDir !== 'false',
            autoIndex : options.autoIndex !== 'false',
            defaultExt : options.ext === true ? 'html' : options.ext
        };

        var wrapLogFn = function (req, res){
            options.logFn && options.logFn(req, res);
            res.emit('next');
        };

        var serverOptions = {
            before : (options.before || []).concat([
                wrapLogFn,
                ecstatic(ecsOptions)
            ]),
            headers : options.headers || {},
            https : options.https || false
        };

        this.server = union.createServer(serverOptions);
    },

    listen : function () {
        this.server.listen.apply(this.server, arguments);
    },

    close : function () {
        return this.server.close();
    }
};

exports.createServer = function (options) {
  return new HTTPServer(options);
};
