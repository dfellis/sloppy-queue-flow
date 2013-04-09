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

var q = require('queue-flow');
var EventEmitter = require('async-cancelable-events');
var util = require('util');

// The `sloppy` constructor function, which either uses the supplied queueing engine, or
// uses the built-in in-memory engine.
function sloppy(nameOrArray, qEnv) {
    EventEmitter.call(this);
	this.qType = sloppy;
    this.namespace = qEnv;

	// Private variables, the handlers and actual queue array
	var eventHandlers = {};
	var queue = [];
	var handler = undefined;
	var openHandlers = 0;

	// Privileged methods

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
	var handlerCallback = function handlerCallback(done) {
        if(done instanceof Function) done();
		openHandlers--;
		if(!openHandlers) {
			this.emit('empty');
		}
	}.bind(this);

	// Inserts a specified value into the queue, if allowed by the event handlers, and
	// calls the special handler function, if it's ready.
	this.push = function push() {
		var values = Array.prototype.slice.call(arguments, 0);
		this.emit('push', values, function(result) {
            if(result) {
    			if(!!handler) {
	    			values = values.concat(queue);
		    		queue = [];
			    	values.forEach(function(value) {
				    	openHandlers++;
					    process.nextTick(handler.bind(this, value, handlerCallback));
    				}.bind(this));
	    		} else {
		    		queue = queue.concat(values);
			    }
    		}
        }.bind(this));
		return this;
	};

	// Signals that the queue is being destroyed and then, if allowed, destroys it
	this.close = function close() {
		this.emit('close', function(result) {
            if(result) {
    			this.removeAllListeners('close');
                this.push = function(){};
		    	this.on('close', function() { return false; });
                function finalizeClose() {
				    if(handler instanceof Function) {
					    handler('close');
    				}
	    			eventHandlers = {};
		    		queue = undefined;
			    	handler = undefined;
                    this.namespace.clearQueue(this);
	    			delete this;
		    	}
                if(openHandlers == 0) {
                    process.nextTick(finalizeClose.bind(this));
                } else {
                    this.on('empty', finalizeClose.bind(this));
                }
    		}
        }.bind(this));
	};

	//  Kills the queue (and all sub-queues) immediately, no possibility of blocking
	// with an event handler.
	this.kill = function kill() {
		this.emit('kill');
		var tempHandler = handler;
		handler = undefined;
		eventHandlers = {};
		queue = undefined;
        this.namespace.clearQueue(this);
		delete this;
		if(tempHandler instanceof Function) {
			tempHandler('kill');
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

util.inherits(sloppy, q.Q);

module.exports = sloppy;
