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
    , oldEnd  = this.end;

  retries = retries || 1;

  this.end = function (fn) {
    var timeout = this._timeout;

    function attemptRetry () {
      return oldEnd.call(self, function (err, res) {
        if (!retries || !shouldRetry(err, res)) return fn && fn(err, res);

        reset(self, timeout);

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

function reset (request, timeout) {
  var headers = request._header;
  var path = request.url;

  request.abort();
  request.called  = false;
  request.aborted = false;
  request._timer = 0;
  request.timeout(timeout);

  for (var k in headers) {
    request.set(k, headers[k]);
  }

  request.url = path.indexOf('?') != -1
              ? path.substr(0, path.indexOf('?'))
              : path;
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
