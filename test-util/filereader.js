var fs = require('fs');
var program = require('commander');
var ThrottledReader = require('../index');

program
    .usage('[options] <file>')
    .option('-r, --rate <bps>',
    'average byte rate to throttle to', parseInt)
    .option('-f, --recovery-factor <f>',
    'factor controlling how often to pause the stream (low=fast)', parseFloat)
    .parse(process.argv);

var filename = program.args[0];
filename && program.args.length === 1 || program.help();

var readStream = fs.createReadStream(filename);
var startTime = new Date();
var chunkCount = 0;
var byteCount = 0;
console.log('Reading ' + filename);

var throttledStream = new ThrottledReader(readStream, {
    rate: program.rate || 0,
    recoveryFactor: program.recoveryFactor || undefined
});

throttledStream.on('data', function(chunk) {
    chunkCount++;
    byteCount += chunk.length;
});

throttledStream.on('end', function() {
    console.log('End of stream');
    if (!byteCount) {
        console.log('Did not read any data');
        return;
    }
    var duration = (new Date().getTime() - startTime.getTime()) / 1000;
    console.log('Read ' + byteCount + ' bytes in ' +
        chunkCount + ' chunks (avg. ' + Math.round(byteCount / chunkCount) +
        ' bytes/chunk)');
    console.log('Read ' + byteCount + ' bytes in ' +
        duration + ' seconds (avg. ' + Math.round(byteCount / duration) +
        ' bytes/second)');
});
