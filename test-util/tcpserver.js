var program = require('commander');
var net = require('net');
var ThrottledReader = require('../index');

program
    .usage('[options]')
    .option('-p, --port <port>',
    'tcp port to listen on [required]', parseInt)
    .option('-r, --rate <bps>',
    'average byte rate to throttle to', parseInt)
    .option('-f, --recovery-factor <f>',
    'factor controlling how often to pause the stream (low=fast)', parseFloat)
    .parse(process.argv);

program.port || program.help();

var server = net.createServer(function(socket) {
    var startTime = new Date();
    var chunkCount = 0;
    var byteCount = 0;
    var clientId = socket.remoteAddress + ':' + socket.remotePort;
    var clientPrefix = '[' + clientId + '] ';
    console.log('Accepted connection from ' + clientId);

    var throttledStream = new ThrottledReader(socket, {
        rate: program.rate || 0,
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
