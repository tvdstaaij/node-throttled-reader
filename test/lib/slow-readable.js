/**
 * Adapted from https://github.com/TooTallNate/node-throttle (MIT license)
 */

var Readable = require('stream').Readable;
var inherits = require('util').inherits;

// Readable stream impl that outputs random data with a 100 ms delay per byte
function SlowReadable (n) {
    Readable.call(this);
    this.remaining = +n;
}
inherits(SlowReadable, Readable);

SlowReadable.prototype._read = function (n, cb) {
    if ('function' != typeof cb) cb = function (e, b) { this.push(b); }.bind(this);
    n = 1;
    this.remaining -= n;
    if (this.remaining >= 0) {
        setTimeout(cb.bind(null, null, new Buffer(n).fill(0)), 100);
    } else {
        this.emit('close');
        cb(null, null); // emit "end"
    }
};

module.exports = SlowReadable;
