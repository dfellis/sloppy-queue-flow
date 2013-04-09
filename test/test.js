var q = require('queue-flow');
var jscoverage = require('jscoverage');
jscoverage.enableCoverage(true);
var sloppy = jscoverage.require(module, '../lib/sloppy-queue-flow');

exports.sloppyType = function(test) {
    test.expect(3);
    test.ok(!!sloppy.prototype);
    test.ok(!!(new sloppy().map));
    test.ok(!!q(undefined, sloppy).map);
    test.done();
};

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

exports.closeExecutesAllDataStaticAndNamedQueues = function(test) {
    test.expect(2);
    var runs = 0;
    q([1, 2, 3, 4], sloppy)
        .map(function(val, callback) {
            setTimeout(function() {
                callback(val*2);
            }, 1000);
        })
        .reduce(function(cum, cur) {
            return cum + cur;
        }, function(result) {
            test.equal(20, result, 'received all data from static queue');
            runs++;
            if(runs == 2) test.done();
        }, 0);
    q('namedSlowQueue', sloppy)
        .map(function(val, callback) {
            setTimeout(function() {
                callback(val*2);
            }, 1000);
        })
        .reduce(function(cum, cur) {
            return cum + cur;
        }, function(result) {
            test.equal(20, result, 'received all data from named queue');
            runs++;
            if(runs == 2) test.done();
        }, 0);
    q('namedSlowQueue').push(1, 2, 3, 4).close();
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