var stream = require('stream');
var util = require('util');

function ThrottledReader(readableStream, throttleOptions, streamOptions) {
    var self = this;
    stream.Readable.call(self, streamOptions);

    throttleOptions = throttleOptions || {};
    self._rate = Number(throttleOptions.rate) || 0;
    self._recoveryFactor = Number(throttleOptions.recoveryFactor) || 0.5;
    self._sourceReadable = false;
    self._sourceEnded = false;
    self._excessBytes = -self._rate;
    self._source = readableStream;

    self._source.on('readable', self._tryRead.bind(self));
    self._source.on('end', self._endStream.bind(self));

    // Forward other Readable events
    ['error', 'close'].forEach(function(event) {
        self._source.on(event, self.emit.bind(self, event));
    });
}
util.inherits(ThrottledReader, stream.Readable);

ThrottledReader.prototype.setRate = function(rate) { this._rate = rate };
ThrottledReader.prototype.getRate = function() { return this._rate };

ThrottledReader.prototype._tryRead = function() {
    var self = this;
    // If the source is readable, then so am I
    if (self._rate <= 0 || self._excessBytes < 0) {
        self._allowRead();
    } else {
        // But take a break when the throughput limit is reached
        self._deferRead();
    }
};

ThrottledReader.prototype._allowRead = function() {
    var self = this;
    self._sourceReadable = true;
    self.read(0); // Trigger readable event
};

ThrottledReader.prototype._deferRead = function() {
    var self = this;
    var bytesToRecover = Math.ceil(self._rate * self._recoveryFactor);
    bytesToRecover += self._excessBytes;
    setTimeout(function() {
        self._excessBytes -= bytesToRecover;
        self._allowRead();
    }, bytesToRecover / self._rate * 1000);
};

ThrottledReader.prototype._endStream = function() {
    var self = this;
    if (!self._sourceEnded) {
        self.push(null);
        self._sourceEnded = true;
    }
};

ThrottledReader.prototype._read = function() {
    var self = this;
    if (!self._sourceReadable) {
        self.push('');
        return;
    }
    var chunk = self._source.read();
    if (chunk !== null) {
        self._excessBytes += chunk.length;
        self.push(chunk);
    } else {
        self._endStream();
    }
    self._sourceReadable = false;
};

module.exports = ThrottledReader;
