/**
 * A test plugin for http-server
 * @author Assaf Moldavsky
 */
module.exports = plugin;

function plugin(data, host) {
  console.log('plugin bootstrapped');
  host.events.on('init', function (options, unionOptions) {
    console.log('plugin: init event caught!');
    options.test = 123;
    unionOptions.before.unshift(function (req, res) {
      console.log('plugin: request!');
      res.emit('next');
    });
  });

  return {};
}

