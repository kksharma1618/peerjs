var util = require('./util');
var EventEmitter = require('eventemitter3');

/**
 * Socket mockup
 * client = {
 *   send: (id, message) => void,
 *   onMessage: (handler: (message) => void)
 * }
 */
function Socket(client) {
  if (!(this instanceof Socket)) return new Socket(client);

  EventEmitter.call(this);

  client.onMessage(function(msg) {
    if (typeof msg === 'string') {
      try {
        msg = JSON.parse(msg);
      } catch(e) {
        console.error('Invalid server message', e, msg);
        // this.emit('error', 'Invalid server message');
        return
      }
    }
    if (msg !== Object(msg) || typeof msg.type !== 'string') {
      console.error('Invalid server message', msg);
      // this.emit('error', 'Invalid server message');
      return;
    }
    this.emit('message', msg);
  });

  // Disconnected manually.
  this.disconnected = false;
  // emit.message on data
}

util.inherits(Socket, EventEmitter);


/** Check in with ID or get one from server. */
Socket.prototype.start = function(id, token) {
  this.id = id;
  this._sendQueuedMessages()
}

/** Send queued messages. */
Socket.prototype._sendQueuedMessages = function() {
  for (var i = 0, ii = this._queue.length; i < ii; i += 1) {
    this.send(this._queue[i]);
  }
}

/** Exposed send for DC & Peer. */
Socket.prototype.send = function(data) {
  if (this.disconnected) {
    return;
  }

  // If we didn't get an ID yet, we can't yet send anything so we should queue
  // up these messages.
  if (!this.id) {
    this._queue.push(data);
    return;
  }

  if (!data.type) {
    this.emit('error', 'Invalid message');
    return;
  }

  var message = JSON.stringify(data);
  client.send(this.id, message);
}

Socket.prototype.sendPong = function() {
}

Socket.prototype.close = function() {
}

module.exports = Socket;
