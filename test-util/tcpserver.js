var program = require('commander');
var net = require('net');
var reportRate = require('./lib/report-rate');
var ThrottledReader = require('../');

/* Note that for this utility to work, a connecting client should dump its
 * data in one go and then immediately close the connection.
 */

program
    .usage('[options]')
    .option('-p, --port <port>',
    'tcp port to listen on [required]', parseInt)
    .option('-r, --rate <bps>',
    'average byte rate to throttle to', parseInt)
    .option('-i, --cooldown-interval <ms>',
    'how often to check whether reading can resume', parseInt)
    .parse(process.argv);

program.port || program.help();

var server = net.createServer(function(socket) {
    var startTime = null;
    var chunkCount = 0;
    var byteCount = 0;
    var clientId = socket.remoteAddress + ':' + socket.remotePort;
    var clientPrefix = '[' + clientId + '] ';
    console.log('Accepted connection from ' + clientId);

    var throttledStream = new ThrottledReader(socket, {
        rate: program.rate || 0,
        cooldownInterval: program.cooldownInterval || undefined
    });

    throttledStream.on('data', function(chunk) {
        startTime = startTime || new Date();
        chunkCount++;
        byteCount += chunk.length;
    });

    throttledStream.on('error', function() {
        console.log(clientPrefix + 'Socket error');
    });

    throttledStream.on('close', function() {
        console.log(clientPrefix + 'Socket closed');
    });

    throttledStream.on('end', function() {
        console.log(clientPrefix + 'End of stream');
        reportRate(byteCount, chunkCount, startTime, program.rate)
            .forEach(function(message) {
                console.log(clientPrefix + message);
            });
    });
});

server.listen(program.port);
console.log('Listening on port ' + program.port);
