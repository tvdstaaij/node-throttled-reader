var stream = require('stream');
var util = require('util');

function ThrottledReader(readableStream, throttleOptions, streamOptions) {
    var self = this;
    stream.Readable.call(self, streamOptions);

    throttleOptions = throttleOptions || {};
    self._rate = Number(throttleOptions.rate) || 0;
    self._cooldownInterval = Number(throttleOptions.cooldownInterval) || 100;
    self._sourceReadable = false;
    self._readPending = false;
    self._sourceEnded = false;
    self._byteBalance = 0;
    self._lastChunkSize = self._rate;
    self._bytesRead = 0;
    self._lastCooldownExecTime = null;
    self._cooldownTimer = null;
    self._source = readableStream;

    self._source.on('readable', function() {
        self._sourceReadable = true;
        self._tryRead();
    });
    self._source.on('end', self._endStream.bind(self));

    // Forward other Readable events
    ['error', 'close'].forEach(function(event) {
        self._source.on(event, self.emit.bind(self, event));
    });
}
util.inherits(ThrottledReader, stream.Readable);

ThrottledReader.prototype.setRate = function(rate) { this._rate = rate };
ThrottledReader.prototype.getRate = function() { return this._rate };

ThrottledReader.prototype._activateCooldown = function() {
    if (this._cooldownTimer) {
        return;
    }
    this._lastCooldownExecTime = new Date();
    this._cooldownTimer = setInterval(this._executeCooldown.bind(this),
        this._cooldownInterval);
};

ThrottledReader.prototype._executeCooldown = function() {
    var now = new Date();
    this._byteBalance -= this._rate * (now - this._lastCooldownExecTime) / 1000;
    this._lastCooldownExecTime = now;
    this._tryRead();
    if (this._isReadAllowed()) {
        clearInterval(this._cooldownTimer);
        this._cooldownTimer = null;
    }
};

ThrottledReader.prototype._isReadAllowed = function() {
    if (this._rate <= 0) {
        return true;
    }
    if (!this._bytesRead) {
        return true;
    }
    if (this._byteBalance <= Math.max(-this._lastChunkSize, -this._rate)) {
        return true;
    }
    this._activateCooldown();
    return false;
};

ThrottledReader.prototype._endStream = function() {
    if (!this._sourceEnded) {
        this.push(null);
        this._sourceEnded = true;
    }
};

ThrottledReader.prototype._tryRead = function() {
    if (!this._readPending || !this._sourceReadable || !this._isReadAllowed()) {
        return;
    }
    this._sourceReadable = false;
    this._readPending = false;
    var chunk = this._source.read();
    if (chunk !== null) {
        this._bytesRead += chunk.length;
        this._lastChunkSize = chunk.length;
        if (this._rate > 0)
            this._byteBalance += chunk.length;
        this.push(chunk);
        this._activateCooldown();
    } else {
        this._endStream();
    }
};

ThrottledReader.prototype._read = function() {
    this._readPending = true;
    if (!this._tryRead()) {
    }
};

module.exports = ThrottledReader;
