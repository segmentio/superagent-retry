var retries = require('./retries');


/**
 * Add to the request prototype.
 */

module.exports = function (superagent) {
  var Request = superagent.Request;
  Request.prototype.retry = retry;
  return superagent;
};


/**
 * Export retries for extending
 */

module.exports.retries = retries;


/**
 * Sets the amount of times to retry the request
 * @param  {Number} count
 */

function retry (retries) {

  var self    = this
    , oldPath = this.url
    , timeout = this._timeout
    , oldEnd  = this.end;

  retries = retries || 1;

  this.end = function (fn) {
    function attemptRetry () {
      return oldEnd.call(self, function (err, res) {
        if (!retries || !shouldRetry(err, res)) return fn && fn(err, res);

        reset(self, oldPath, timeout);

        retries--;
        return attemptRetry();
      });
    }

    return attemptRetry();
  };

  return this;
}


/**
 * HACK: Resets the internal state of a request.
 */

function reset (request, url, timeout) {
  if (request.req) {
    var headers = request.req._headers;
    var path = request.url;

    request.req.abort();
    request.called = false;
    delete request.req;

    for (var k in headers) {
      request.set(k, headers[k]);
    }

    if (!request.qs) {
      request.req.path = path;
    }
  } else {
    request.abort();
    request.clearTimeout();
  }

  delete request._timer;
  request.timeout(timeout);
}


/**
 * Determine whether we should retry based upon common error conditions
 * @param  {Error}    err
 * @param  {Response} res
 * @return {Boolean}
 */

function shouldRetry (err, res) {
  return retries.some(function (check) { return check(err, res); });
}
