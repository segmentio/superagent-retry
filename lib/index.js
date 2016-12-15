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
 * @param  {Number} [delay] optional delay in ms
 */

function retry (retries, delay) {

  var self    = this
    , oldEnd  = this.end;

  retries     = retries === Number(retries) && retries || 1;
  delay       = delay === Number(delay) && delay || 0;

  this.end = function (fn) {
    var timeout = this._timeout;

    function attemptRetry () {
      return oldEnd.call(self, function (err, res) {
        if (!retries-- || !shouldRetry(err, res)) return fn && fn(err, res);

        setTimeout(function() {
          reset(self, timeout);
          attemptRetry()
        }, delay);
      });
    }

    return attemptRetry();
  };

  return this;
}


/**
 * HACK: Resets the internal state of a request.
 */

function reset (request, timeout) {
  var headers = request.req._headers;
  var path = request.req.path;

  request.req.abort();
  request.called = false;
  request.timeout(timeout);
  delete request.req;
  delete request._timer;
  delete request._endCalled;

  for (var k in headers) {
    request.set(k, headers[k]);
  }

  if (!request.qs) {
    request.req.path = path;
  }
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
