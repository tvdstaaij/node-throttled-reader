var assert = require('chai').assert;
var fs = require('fs');
var tmp = require('tmp');
var ThrottledReader = require('../');

var KB = Math.pow(10, 3);
var MB = Math.pow(KB, 2);

describe('ThrottledReader', function() {
    this.timeout(10000);

    [
        // [size, rate, tolerance%]
        [3 * MB, 1 * MB, 10],
        [20 * MB, 10 * MB, 10],
        [1 * MB, 0.75 * MB, 10],
        [0.5 * MB, 0.5 * MB, 15],
        [3/5 * MB, 1/5 * MB, 15],
        [2 * MB, 3 * MB, 15],
        [50 * KB, 10 * KB, 25]
    ]
        .forEach(function(testVector) {
            var expectedTime = (testVector[0] / testVector[1]).toFixed(2);
            var description = 'should take ' + expectedTime + 's ' +
                '+/-' + testVector[2] + '% to read a file of ' +
                testVector[0] + ' bytes at a rate of ' + testVector[1] +
                ' bytes per second';
            it(description, function(done) {
                testFileRead.apply(undefined, testVector.concat(done));
            });
        });

    it('should read a 2MB file with an unlimited rate within 100 ms',
        function(done) {
            testFileRead(2000000, 0, 100, done);
        });

    it('should read a 2MB file with a 5MB/s rate within 100 ms',
        function(done) {
            testFileRead(2000000, 5000000, 100, done);
        });

    it('should be able to read a single-byte file without throttle',
        function(done) {
            testFileRead(1, 0, null, done);
        });

    it('should be able to read a single-byte file with throttle',
        function(done) {
            testFileRead(1, 10, null, done);
        });
});

function testFileRead(size, rate, tolerance, cb) {
    var tempFile = tmp.fileSync().name;
    fs.writeFileSync(tempFile, new Buffer(size).fill(0));
    var throttledStream = new ThrottledReader(fs.createReadStream(tempFile), {
        rate: rate
    });
    var startTime = null;
    var endTime = null;
    var byteCount = 0;
    var ended = false;
    var closed = false;

    function finish() {
        assert(endTime && startTime);
        var measured = endTime - startTime;
        if (rate > 0 && tolerance !== null) {
            var expected = size / rate * 1000;
            var error = Math.abs(measured - expected);
            var acceptable = expected / 100 * tolerance;
            assert.isBelow(error, acceptable);
        } else {
            if (tolerance > 0) {
                assert.isBelow(measured, tolerance);
            }
        }
        console.log(measured.toFixed(3));
        cb();
    }

    throttledStream.on('data', function(chunk) {
        startTime = startTime || new Date();
        assert.instanceOf(chunk, Buffer);
        assert.isAbove(chunk.length, 0);
        assert(chunk.equals(new Buffer(chunk.length).fill(0)));
        byteCount += chunk.length;
    });
    throttledStream.on('close', function() {
        closed = true;
        if (ended) finish();
    });
    throttledStream.on('end', function() {
        endTime = new Date();
        assert.equal(byteCount, size);
        ended = true;
        if (closed) finish();
    });
}
