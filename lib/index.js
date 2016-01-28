var retries = require('./retries');


/**
 * Add to the request prototype.
 */

module.exports = function(superagent) {
  var Request = superagent.Request;
  var Response = superagent.Response;
  Request.prototype.retry = retry;


  if (typeof window != 'undefined') {

    // fixing abort superagent method for brower
    Request.prototype.abort = function() {
      if (this.aborted) return;
      this.aborted = true;
      this.xhr.abort();

      if (!this._retrying) {
        this.clearTimeout();
        this.emit('abort');
      }

      return this;
    };

    Request.prototype.crossDomainError = function() {
      var err = new Error('Origin is not allowed by Access-Control-Allow-Origin');
      err.crossDomain = true;
      this.callback(err, new Response(this));
    };


  }

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

        if (!retries || !shouldRetry(err, res)) {
          self._retrying = false;
          return fn && fn(err, res);
        }

        reset(self, timeout);

        retries--;

        self.emit('retry', retries);

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
  // fix for browser
  if (typeof window != 'undefined') {
    request.timeout(timeout);
    request.aborted = false;
    request.timedout = false;
    request._retrying = true;
    delete request._timer;
  } else {
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
