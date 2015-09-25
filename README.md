# throttled-reader

[![npm version](https://img.shields.io/npm/v/throttled-reader.svg)](https://www.npmjs.com/package/throttled-reader)
[![npm license](https://img.shields.io/npm/l/throttled-reader.svg)](https://www.npmjs.com/package/throttled-reader)

This module is for throttling the data rate on a `Readable` stream. This is not
done by buffering but rather by rate-limited reading in paused mode, meaning the
throttle is relatively close to the source.

Example use case: unlike other throttle modules that use buffering, this can be
used to effectively throttle an incoming TCP stream, affecting the other side
of the connection as well because the internal Node and OS buffers will congest.

This is a potentially usable but unstable beta version; it needs some more 
experimentation and automated unit tests. Accuracy varies with parameters and
circumstances. My tests show that with sockets and files tolerance is about 5%
when internal Node buffer sizes are insignificant compared to the configured
data rate. It would be a great help if someone could answer
[Reading a paused stream in fixed size chunks][1] on Stack Overflow, or offer
other suggestions/patches for improving throttle accuracy.

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
    Option           | Default | Description
    ---------------- | ------- | -----------
    `rate`           | 0       | Average rate to throttle to (bytes/sec).
    &nbsp;           | &nbsp;  | Must be set to a positive value.
    `recoveryFactor` | 0.5     | Controls how long to pause reading relative to
    &nbsp;           | &nbsp;  | the data rate. Influences accuracy, processing
    &nbsp;           | &nbsp;  | overhead and overshoot.
* `streamOptions` may contain constructor options for the new `Readable`.

The data rate can be dynamically changed using `getRate()` and `setRate(rate)`.

[1]: http://stackoverflow.com/q/32771957/1239690
[2]: https://nodejs.org/api/stream.html#stream_class_stream_readable
