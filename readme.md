# sloppy-queue-flow

## Quick install instructions

For Node.js

    npm install sloppy-queue-flow

For developers, ``npm test`` to check your changes (using [nodeunit](https://github.com/caolan/nodeunit/)) haven't broken existing functionality. Literate programming documentation can be found inside of the ``/docs`` directory, generated by [docco](http://jashkenas.github.com/docco/).

## Usage

For details on how it all works in general, see the [queue-flow](https://github.com/dfellis/queue-flow/) library for detailed API documentation and usage examples.

``sloppy-queue-flow`` is a replacement constructor function that eliminates guarantees on queue order to allow execution on each item in the queue to traverse through the flow as fast as possible. This is a trade-off that makes sense for things like the Express-like server example from the main queue-flow library, but would break the dependency resolution example. Essentially, ``sloppy-queue-flow`` is only valid for cases where all operations are [commutative](http://en.wikipedia.org/wiki/Commutative_property), which is not everything, but does cover a surprising number of cases.

To use ``sloppy-queue-flow`` in Node.js, simply:

```js
var q = require('queue-flow');
var sloppy = require('sloppy-queue-flow');

q('sloppyQueue', sloppy) // Code here
```

## When should you use sloppy-queue-flow over the "regular" queue-flow?

### Are the items in the queue totally independent?

Such as HTTP request-response pairs that will be served to totally different users and have no impact on one another? Then ``sloppy-queue-flow`` will improve the performance of the system and push the bottlenecks out to your I/O.

### Can the items in the queue be processed in any order even if the outcome depends on all of them?

Such as ``4*3*2 == 2*3*4``? Then ``sloppy-queue-flow`` can be used, but you must be cautious. If at any time in the future you change it to something that *can't* be reordered, such as ``4/3/2 != 2/3/4``, then you need to drop usage of ``sloppy-queue-flow``.

### General Rule of Thumb

``queue-flow`` as a source code organizer for event/request handlers can use ``sloppy-queue-flow``.

``queue-flow`` as a data processor should not use ``sloppy-queue-flow``, unless you're *sure* it won't screw things up and you're *sure* the queueing is the bottleneck (if each step along the flow has a predictable processing time, ``sloppy-queue-flow`` will not provide any measureable advantage if the number of stages exceeds the number of processor cores).

## License (MIT)

Copyright (C) 2012 by David Ellis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
