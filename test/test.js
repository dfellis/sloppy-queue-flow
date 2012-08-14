var q = require('queue-flow');
var sloppy = require('../lib/sloppy-queue-flow');

exports.sloppy = function(test) {
	test.expect(3);
	q([1, 2, 3, 4, 5])
		.map(function(val) {
			return val*2;
		})
		.toArray(function(outArr) {
			test.equal([2, 4, 6, 8, 10].toString(), outArr.toString(), 'queue-flow is behaving properly');
		});
	q([1, 2, 3, 4, 5], sloppy)
		.map(function(val, callback) {
			setTimeout(callback.bind(this, val*2), 1000/val);
		})
		.toArray(function(outArr) {
			test.notEqual([2, 4, 6, 8, 10].toString(), outArr.toString(), 'sloppy-queue-flow passes along results on a first-done basis');
			test.equal([2, 4, 6, 8, 10].toString(), outArr.sort(function(a,b) { return a-b; }).toString(), 'sloppy-queue-flow passes along all values');
			test.done();
		});
};
