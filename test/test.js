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

exports.jscoverage = function(test) {
    test.expect(1);
    var file, tmp, source, total, touched;
    for (var i in _$jscoverage) {
        test.ok(true, 'only one file tested by jscoverage');
        file = i;
        tmp = _$jscoverage[i];
        source = _$jscoverage[i].source;
        total = touched = 0;
        for (var n=0,len = tmp.length; n < len ; n++){
            if (tmp[n] !== undefined) {
                total ++ ;
                if (tmp[n] > 0) {
                    touched ++;
                } else {
                    console.log(n + "\t:" + source[n-1]);
                }
            }
        }
        // test.equal(total, touched, 'All lines of code touched by test suite');
        // Eventually will uncomment the above line, just like in the main queue-flow repo
    }
    test.done();
};
