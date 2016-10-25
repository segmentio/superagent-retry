var retries = require('./retries');


/**
 * Add to the request prototype.
 */

module.exports = function (superagent) {
  var Request = superagent.Request;
  Request.prototype.retry = retry;
  Request.prototype.delayRetry = delayRetry;
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

function retry (retries, userShouldRetry) {

  var self    = this
    , oldEnd  = this.end
    , noop  = function () { return false; };

  this._delayRetryTime = this._delayRetryTime || 0;
  retries = retries || 1;
  userShouldRetry = userShouldRetry || noop;

  this.end = function (fn) {
    var timeout = this._timeout;

    function shouldRetry (err, res) {
      return baseShouldRetry(err, res) || userShouldRetry(err, res);
    }


    function attemptRetry () {
      setTimeout(function () {
        return oldEnd.call(self, function (err, res) {
          if (!retries || !shouldRetry(err, res)) return fn && fn(err, res);

          reset(self, timeout);

          retries--;
          return attemptRetry();
        });
      }, self._delayRetryTime);
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

  for (var k in headers) {
    request.set(k, headers[k]);
  }

  if (!request.qs) {
    request.req.path = path;
  }
}


/**
 * Waits a certain time before retrying
 */

function delayRetry (miliseconds) {
  this._delayRetryTime = miliseconds;

  return this;
}


/**
 * Determine whether we should retry based upon common error conditions
 * @param  {Error}    err
 * @param  {Response} res
 * @return {Boolean}
 */

function baseShouldRetry (err, res) {
  return retries.some(function (check) { return check(err, res); });
}
