# throttled-reader

[![npm version](https://img.shields.io/npm/v/throttled-reader.svg)](https://www.npmjs.com/package/throttled-reader)
[![npm license](https://img.shields.io/npm/l/throttled-reader.svg)](https://www.npmjs.com/package/throttled-reader)
[![travis build](https://travis-ci.org/tvdstaaij/node-throttled-reader.svg?branch=master)](https://travis-ci.org/tvdstaaij/node-throttled-reader)

This module is for throttling the data rate on a streams2+ `Readable` stream.
This is not done by buffering but rather by rate-limited reading in paused mode,
meaning the throttle is relatively close to the source.

Example use case: unlike other throttle modules that use buffering, this can be
used to effectively throttle an incoming TCP stream, affecting the other side
of the connection as well because the internal Node and OS buffers will congest.

Accuracy can be anywhere from <1% to over 25% depending on the rate and the
kind of source. High rate limits, slower streams and streams with few/small
buffers tend to be throttled more accurately. The utilities in `test-util`
can be used to perform measurements with socket and file streams.

## Basic usage

Just wrap your readable stream in a `ThrottledReader` instance, which is also
a `Readable`. You can then use the throttled stream in its place.
`ThrottledReader` must be the only consumer of the source stream's data!

```javascript
var ThrottledReader = require('throttled-reader');

var throttledStream = new ThrottledReader(sourceStream, {
    rate: 10 * 1024 // In bytes per second
});

throttledStream.pipe(destinationStream);
```

## Reference

Constructor:
`ThrottledReader(readableStream[, throttleOptions[, streamOptions]])`

* `readableStream` is the [`Readable`][1] to read from.
* `throttleOptions` may contain the following options:
    
    Option             | Default | Description
    ------------------ | ------- | -----------
    `rate`             | 0       | Average rate to throttle to (bytes/sec).
    &nbsp;             | &nbsp;  | Zero means unlimited.
    `cooldownInterval` | 100     | How often to determine whether reading may
    &nbsp;             | &nbsp;  | continue (ms). Lower values are more accurate
    &nbsp;             | &nbsp;  | but also introduce more processing overhead.
    
* `streamOptions` may contain constructor options for the new `Readable`.

The data rate can be dynamically changed using `getRate()` and `setRate(rate)`.

[1]: https://nodejs.org/api/stream.html#stream_class_stream_readable
