function reportRate(byteCount, chunkCount, startTime, targetRate) {
    var output = [];
    if (!byteCount) {
        output.push('Did not receive any data');
        return;
    }
    var duration = (new Date() - startTime) / 1000;
    var measuredRate = byteCount / duration;
    var error = measuredRate - targetRate;
    var errorPercentage = Math.abs(error) / targetRate * 100;
    output.push('Read ' + byteCount + ' bytes in ' + chunkCount +
         ' chunks, averaging ' + Math.round(byteCount / chunkCount) +
         ' bytes per chunk');
    output.push('Took ' + duration + ' seconds, averaging ' +
        Math.round(measuredRate) + ' bytes per second');
    output.push('This is an error of ' + (error < 0 ? '' : '+') +
        Math.round(error) + ' (' + errorPercentage.toFixed(2) + '%)');
    return output;
}

module.exports = reportRate;
