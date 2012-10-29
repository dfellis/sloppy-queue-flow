var jscoverage = require('jscoverage');
var require = jscoverage.require(module);
var q = require('queue-flow');
var sloppy = require('../lib/sloppy-queue-flow', true);

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

exports.badHandler = function(test) {
	test.expect(1);
	q('blah', sloppy)
		.on('push', 'notAValidHandler')
		.toArray(function(outArr) {
			test.equal([1, 2, 3, 4, 5].toString(), outArr.toString(), 'sloppy-queue-flow ignored the invalid event handler');
			test.done();
		});
	q('blah').push(1, 2, 3, 4, 5).close();
};

exports.kill = function(test) {
	test.expect(2);
	q('toKill', sloppy).kill();
	test.equal(q.exists('toKill'), false, 'kills the queue, immediately');
	q('toKill', sloppy)
		.branch('toAlsoKill');
	q('toKill').kill();
	test.equal(q.exists('toAlsoKill'), false, 'kills the subqueue, immediately');
	test.done();
};

exports.processNextTickPatch = function(test) {
	test.expect(2);
	process.oldNextTick = process.nextTick;
	process.nextTick = undefined;
	var sloppy2 = require('../lib/sloppy-queue-flow', true);
	test.equal(process.nextTick, setTimeout, 'setTimeout is properly substituted in for process.nextTick');
	// jscoverage can't handle two different requires of the same module where the module goes through a
	// different initialization path. The following is a hack to get the coverage report to remove the
	// clearly-covered lines of code. (I don't expect this code to change much, if ever, so this should be fine)
	for(var i in _$jscoverage) {
		source = _$jscoverage[i].source;
		for(var j = 0; j < _$jscoverage[i].length; j++) {
			if(/process = process/.test(source[j-1])) _$jscoverage[i][j] = undefined;
			if(/process\.nextTick = process\.nextTick/.test(source[j-1])) _$jscoverage[i][j] = undefined;
		}
	}
	test.ok(!!sloppy2(), 'can construct sloppy-queue-flow objects without process.nextTick');
	// Restore environment back to normal
	process.nextTick = process.oldNextTick;
	process.oldNextTick = undefined;
	test.done();
};

exports.jscoverage = function(test) {
	test.expect(2);
	var file, tmp, source, total, touched;
	for (var i in _$jscoverage) {
		test.ok(true, 'only one file tested by jscoverage');
		file = i;
		tmp = _$jscoverage[i];
		source = _$jscoverage[i].source;
		total = touched = 0;
		for(var n = 0, len = tmp.length; n < len; n++) {
			if(/sloppy\.prototype = q\.Q\.prototype/.test(source[n-1])) tmp[n] = undefined; // This line can only possibly run in the browser
			if(tmp[n] !== undefined) {
				total++;
				if(tmp[n] > 0) {
					touched++;
				} else {
					console.log(n + "\t:" + source[n-1]);
				}
			}
		}
		test.equal(total, touched, 'All lines of code touched by test suite');
	}
	test.done();
};