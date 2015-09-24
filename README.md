# throttled-reader

This module is for throttling the data rate on a `Readable` stream. This is not
done by buffering but rather by rate-limited reading in paused mode, meaning the
throttle is very close to the source.

Example use case: unlike other throttle modules that use buffering, this can be
used to effectively throttle an incoming TCP stream, affecting the other side
 of the connection as well.

This is a potentially usable but unstable beta version. It is not
thoroughly tested.

## Basic usage

Just wrap your readable stream in a `ThrottledReader` instance, which is also
a `Readable`. You can then use the throttled stream in its place.

```javascript
var ThrottledReader = require('throttled-reader');

var throttledStream = new ThrottledReader(sourceStream, {
    averageRate: 10 * 1024 // In bytes per second
});

throttledStream.pipe(destinationStream);
```
