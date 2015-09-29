# throttled-reader

[![npm version](https://img.shields.io/npm/v/throttled-reader.svg)](https://www.npmjs.com/package/throttled-reader)
[![npm license](https://img.shields.io/npm/l/throttled-reader.svg)](https://www.npmjs.com/package/throttled-reader)

This module is for throttling the data rate on a streams2+ `Readable` stream.
This is not done by buffering but rather by rate-limited reading in paused mode,
meaning the throttle is relatively close to the source.

Example use case: unlike other throttle modules that use buffering, this can be
used to effectively throttle an incoming TCP stream, affecting the other side
of the connection as well because the internal Node and OS buffers will congest.

Accuracy can be anywhere from <1% to over 25% depending on the rate and the
kind of source. High rate limits, slower streams and streams with few/small
buffers tend to be throttled more accurately. There's plenty of room for
improvement here; it would be a great help if someone could answer
[Reading a paused stream in fixed size chunks][1] on Stack Overflow, or offer
other suggestions/patches for improving throttle accuracy. The utilities
in `test-util` can be used to perform measurements with socket and file streams.

The module has been tested with Node versions 0.12.7 and 4.1.0. Run the tests
to see whether it works with your version:
```bash
npm install
npm install -g mocha
npm test
```

## Basic usage

Just wrap your readable stream in a `ThrottledReader` instance, which is also
a `Readable`. You can then use the throttled stream in its place.

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

* `readableStream` is the [`Readable`][2] to read from.
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

[1]: http://stackoverflow.com/q/32771957/1239690
[2]: https://nodejs.org/api/stream.html#stream_class_stream_readable
