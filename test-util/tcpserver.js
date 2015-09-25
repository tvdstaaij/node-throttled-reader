var program = require('commander');
var net = require('net');
var ThrottledReader = require('../index');

program
    .usage('[options]')
    .option('-p, --port <port>',
    'tcp port to listen on (required)', parseInt)
    .option('-r, --rate <bps>',
    'average byte rate to throttle to (required)', parseInt)
    .option('-f, --recovery-factor <f>',
    'how often to re-calculate bandwidth', parseFloat)
    .parse(process.argv);

program.port && program.rate || program.help();

var server = net.createServer(function(socket) {
    var startTime = new Date();
    var chunkCount = 0;
    var byteCount = 0;
    var clientId = socket.remoteAddress + ':' + socket.remotePort;
    var clientPrefix = '[' + clientId + '] ';
    console.log('Accepted connection from ' + clientId);

    var throttledStream = new ThrottledReader(socket, {
        averageRate: program.rate,
        recoveryFactor: program.recoveryFactor || undefined
    });

    throttledStream.on('data', function(chunk) {
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
        if (!byteCount) {
            console.log(clientPrefix + 'Did not receive any data');
            return;
        }
        var duration = (new Date().getTime() - startTime.getTime()) / 1000;
        console.log(clientPrefix + 'Received ' + byteCount + ' bytes in ' +
            chunkCount + ' chunks (avg. ' + Math.round(byteCount / chunkCount) +
            ' bytes/chunk)');
        console.log(clientPrefix + 'Received ' + byteCount + ' bytes in ' +
            duration + ' seconds (avg. ' + Math.round(byteCount / duration) +
            ' bytes/second)');
    });
});

server.listen(program.port);
console.log('Listening on port ' + program.port);
