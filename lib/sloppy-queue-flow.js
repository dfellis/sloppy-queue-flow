// sloppy-queue-flow Copyright (C) 2012 by David Ellis
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

// The `sloppy` constructor function, which either uses the supplied queueing engine, or
// uses the built-in in-memory engine.
function sloppy(nameOrArray) {
	this.qType = sloppy;

	// Private variables, the handlers and actual queue array
	var eventHandlers = {};
	var queue = [];
	var handler = undefined;
	var openHandlers = 0;

	// Privileged methods

	// `on` registers event handlers
	this.on = function on(eventName, handler) {
		eventHandlers[eventName] = eventHandlers[eventName] instanceof Array ? eventHandlers[eventName] : [];
		eventHandlers[eventName].push(handler);
		return this;
	};

	// `fire` executes the event handlers, passing along whatever arguments given to it
	// minus the event name indicator, of course. If any handler returns false, it indicates
	// so, indiating to the method firing the event to cancel.
	this.fire = function fire(eventName) {
		var newArgs = Array.prototype.slice.call(arguments, 1);
		if(eventHandlers[eventName]) {
			return eventHandlers[eventName].every(function(handler) {
				if(handler instanceof Function) {
					return handler.apply(this, newArgs) !== false;
				}
				return true;
			}.bind(this));
		} else {
			return true;
		}
	};

	// `clear` clears all event handlers from the specified event
	this.clear = function clear(eventName) {
		eventHandlers[eventName] = [];
	};

	// `setHandler` defines the special function to call to process the queue
	// assumed to be ready initially, when called marked busy, call provided callback to
	// mark ready again.
	this.setHandler = function setHandler(handlerFunc) {
		handler = handlerFunc;
		if(queue && queue.length > 0) {
			this.push();
		}
		return this;
	};

	// The `handlerCallback` is provided to the handler along with the dequeued value.
	// If there is more work to be done, it continues, otherwise is marks the handler
	// as ready for when the data next arrives
	var handlerCallback = function handlerCallback() {
		openHandlers--;
		if(!openHandlers) {
			this.fire('empty');
		}
	}.bind(this);

	// Inserts a specified value into the queue, if allowed by the event handlers, and
	// calls the special handler function, if it's ready.
	this.push = function push() {
		var values = Array.prototype.slice.call(arguments, 0);
		if(this.fire('push', values)) {
			if(!!handler) {
				values = values.concat(queue);
				queue = [];
				values.forEach(function(value) {
					openHandlers++;
					setTimeout(handler.bind(this, value, handlerCallback), 0);
				}.bind(this));
			} else {
				queue = queue.concat(values);
			}
		}
		return this;
	};

	// Signals that the queue is being destroyed and then, if allowed, destroys it
	this.close = function close() {
		if(this.fire('close')) {
			this.clear('close');
			this.on('close', function() { return false; });
			setTimeout(function() {
				if(handler instanceof Function) {
					handler('close');
				}
				eventHandlers = {};
				queue = undefined;
				handler = undefined;
				delete this;
			}, 0);
		}
	};

	// Start processing the queue after the next JS event loop cycle and return the queue
	// object to the remaining code.
	if(nameOrArray instanceof Array) {
		this.push.apply(this, nameOrArray);
		if(queue.length > 0) this.on('empty', this.close.bind(this));
	}
	return this;
}

if(module && module.exports) {
	// If in a CommonJS environment like Node.js, grab the
	// queue-flow prototype via a require statement and then
	// export the resulting object, except if queue-flow has
	// been added to the global scope (for those who want to
	// guarantee that `q('someQueue') instanceof q.Q` is true
	sloppy.prototype = global.q && !!q.Q ? q.Q.prototype : require('queue-flow').Q.prototype;
	module.exports = sloppy;
} else {
	// Otherwise assume it's already been defined in scope
	// and attach the prototype that way
	sloppy.prototype = q.Q.prototype;
}
