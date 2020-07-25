# ⚠️ Unmaintained ⚠️

This repository is unmaintained, and this [functionality has been added to superagent core](https://visionmedia.github.io/superagent/#retrying-requests).

# superagent-retry

  Extends the node version of [`visionmedia/superagent`][superagent]'s `Request`, adds a `.retry` method to add retrying logic to the request. Calling this will retry the request however many additional times you'd like.


  [superagent]: https://github.com/visionmedia/superagent

## Usage

```javascript
var superagent = require('superagent');
require('superagent-retry')(superagent);

superagent
  .get('https://segment.io')
  .retry(2) // retry twice before responding
  .end(onresponse);


function onresponse (err, res) {
  console.log(res.status, res.headers);
  console.log(res.body);
}
```

You can optionally add a delay to each retry.

```javascript
superagent
  .get('https://segment.io')
  .retry(2, 500) // retry twice with 0.5 second delay
  .end(onresponse);
```

## Retrying Cases

  Currently the retrying logic checks for:

  * ECONNRESET
  * ECONNREFUSED
  * ETIMEDOUT
  * EADDRINFO
  * ESOCKETTIMEDOUT
  * superagent client timeouts
  * bad gateway errors (502, 503, 504 statuses)
  * Internal Server Error (500 status)


## License

(The MIT License)

Copyright (c) 2013 Segmentio &lt;friends@segment.io&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
