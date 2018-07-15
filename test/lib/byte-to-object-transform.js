var stream = require('stream');
var util = require('util');

function ByteToObjectTransform() {
    stream.Transform.call(this, {readableObjectMode: true});
}
util.inherits(ByteToObjectTransform, stream.Transform);

ByteToObjectTransform.prototype._transform = function(chunk, encoding, cb) {
    for (var i = 0; i < chunk.length; i++) {
        this.push({byte: chunk[i]});
    }
    cb();
};

ByteToObjectTransform.prototype._flush = function(cb) {
    cb();
};

module.exports = ByteToObjectTransform;
