var assert = require('chai').assert;
var fs = require('fs');
var tmp = require('tmp');
var SlowReadable = require('./lib/slow-readable');
var ThrottledReader = require('../');

var KB = Math.pow(10, 3);
var MB = Math.pow(KB, 2);

describe('ThrottledReader', function() {
    this.timeout(7500);

    [
        // [size, rate, tolerance%]
        [3 * MB, 1 * MB, 10],
        [20 * MB, 10 * MB, 15],
        [1 * MB, 0.75 * MB, 15],
        [0.5 * MB, 0.5 * MB, 15],
        [3/5 * MB, 1/5 * MB, 15],
        [3 * MB, 2 * MB, 15],
        [50 * KB, 10 * KB, 25]
    ]
        .forEach(function(testVector) {
            var expectedTime = (testVector[0] / testVector[1]).toFixed(2);
            var description = 'should take ' + expectedTime + 's ' +
                '+/-' + testVector[2] + '% to read a file of ' +
                testVector[0] + 'B at a rate of ' + testVector[1] + 'B/s';
            it(description, function(done) {
                testFileRead.apply(undefined, testVector.concat(done));
            });
        });

    it('should read a 2MB file with an unlimited rate within 150ms',
        function(done) {
            testFileRead(2 * MB, 0, -150, done);
        });

    it('should read a 500KB file with a 20MB/s rate within 150ms',
        function(done) {
            testFileRead(500 * KB, 20 * MB, -150, done);
        });

    it('should be able to read a single-byte file without throttle within 50ms',
        function(done) {
            testFileRead(1, 0, -50, done);
        });

    // This does not currently pass within 50ms because it triggers a cooldown
    // Possible improvement for the throughput calculation
    it('should be able to read a single-byte file with throttle',
        function(done) {
            testFileRead(1, 100, null, done);
        });

    it('should be able to read a slower readable', function(done) {
        var size = 10;
        var readable = new SlowReadable(size);
        testRate(readable, size, size * 10, -1150, done);
    });

    it('should accelerate after a sudden throttle release', function(done) {
        var throttledStream = testFileRead(10 * MB, 5 * MB, -1150, done);
        setTimeout(function() {
            throttledStream.setRate(0);
        }, 999);
    });

    it('should function in cascade', function(done) {
        var firstStageEnded = false;
        var testVector = [10 * MB, 5 * MB, 15];
        var fileStream = getTestFileStream(testVector[0]);
        var throttledStream = new ThrottledReader(fileStream, {
            rate: testVector[1]
        });
        throttledStream.on('end', function() {
            firstStageEnded = true;
        });
        testRate.apply(undefined, [throttledStream].concat(testVector).concat([
            function() {
                assert(firstStageEnded);
                done();
            }
        ]));
    });

});

function getTestFileStream(size) {
    var tempFile = tmp.fileSync().name;
    fs.writeFileSync(tempFile, new Buffer(size).fill(0));
    return fs.createReadStream(tempFile);
}

function testFileRead(size, rate, tolerance, cb) {
    var fileStream = getTestFileStream(size);
    return testRate.bind(undefined, fileStream).apply(undefined, arguments);
}

// Positive tolerance is a percentage;
// negative tolerance is an absolute limit (ms)
function testRate(source, size, rate, tolerance, cb) {
    var throttledStream = new ThrottledReader(source, {
        rate: rate,
        cooldownInterval: 50
    });
    var startTime = null;
    var endTime = null;
    var byteCount = 0;
    var ended = false;
    var closed = false;

    function finish() {
        assert(endTime && startTime);
        var measured = endTime - startTime;
        console.log('Measured ' + measured +' ms');
        if (tolerance > 0) {
            var expected = size / rate * 1000;
            var error = Math.abs(measured - expected);
            var acceptable = expected / 100 * tolerance;
            console.log('Error is ' + error.toFixed(3) + 'ms on a ' +
                acceptable.toFixed(3) + 'ms margin');
            assert.isBelow(error, acceptable);
        } else if (tolerance < 0) {
            tolerance = Math.abs(tolerance);
            console.log('Limit is ' + tolerance + 'ms');
            assert.isBelow(measured, tolerance);
        }
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
    return throttledStream;
}
