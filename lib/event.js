/**
 * @author Assaf Moldavsky
 */

module.exports = Event;

function Event(eventId) { this.id = eventId; };
Event.prototype.id = null;
Event.prototype.fire = function (args) {
  var response;
  this.subscribers.forEach(function (handlerFn) {
    var _response = handlerFn.apply(this, args);
    if (_response === false) {
      response = false;
      return false; // break loop
    }
  });
  return response;
};
Event.prototype.subscribers = [];
Event.prototype.subscribe = function (handlerFn) {
  this.subscribers.push(handlerFn);
};
