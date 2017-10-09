var util = require('./util');
var EventEmitter = require('eventemitter3');

/**
 * An abstraction on top of firebase.
 * fbClient - a working firebase client
 */
function Socket(fbClient, options) {
  if (!(this instanceof Socket)) return new Socket(fbClient, options);

  EventEmitter.call(this);

  // Disconnected manually.
  this.disconnected = false;
  this._queue = [];
  // emit.message on data
}

util.inherits(Socket, EventEmitter);


/** Check in with ID or get one from server. */
Socket.prototype.start = function(id, token) {
  this.id = id;
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
  if (this._wsOpen()) {
    this._socket.send(message);
  } else if(data.type !== 'PONG') {
    var http = new XMLHttpRequest();
    var url = this._httpUrl + '/' + data.type.toLowerCase();
    http.open('post', url, true);
    http.setRequestHeader('Content-Type', 'application/json');
    http.send(message);
  }
}

Socket.prototype.sendPong = function() {
  if (this._wsOpen()) {
    this.send({type:'PONG'});
    if (this._wsTimeout) {
      clearTimeout(this._wsTimeout);
    }
    this._setWSTimeout();
  }
}

Socket.prototype.close = function() {
  if (!this.disconnected) {
    this.disconnected = true;
    if(this._wsOpen()) {
      this._socket.close();
    }
    if(this._http) {
        this._http.abort();
    }
    clearTimeout(this._timeout);
  }
}

module.exports = Socket;
