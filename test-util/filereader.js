var fs = require('fs');
var program = require('commander');
var reportRate = require('./lib/report-rate');
var ThrottledReader = require('../');

program
    .usage('[options] <file>')
    .option('-r, --rate <bps>',
    'average byte rate to throttle to', parseInt)
    .option('-i, --cooldown-interval <ms>',
    'how often to check whether reading can resume', parseInt)
    .parse(process.argv);

var filename = program.args[0];
filename && program.args.length === 1 || program.help();

var readStream = fs.createReadStream(filename);
var startTime = null;
var chunkCount = 0;
var byteCount = 0;
console.log('Reading ' + filename);

var throttledStream = new ThrottledReader(readStream, {
    rate: program.rate || 0,
    cooldownInterval: program.cooldownInterval || undefined
});

throttledStream.on('data', function(chunk) {
    startTime = startTime || new Date();
    chunkCount++;
    byteCount += chunk.length;
});

throttledStream.on('end', function() {
    console.log('End of stream');
    reportRate(byteCount, chunkCount, startTime, program.rate)
        .forEach(function(message) {
            console.log(message);
        });
});
