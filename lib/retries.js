/**
 * Common retry conditions
 */

module.exports = [
  econnreset,
  econnrefused,
  etimedout,
  eaddrinfo,
  esockettimedout,
  crossDomain,
  gateway,
  timeout,
  internal
];


/**
 * Connection reset detection
 */

function econnreset (err, res) {
  return err && err.code === 'ECONNRESET';
}

/**
 * Connection refused detection
 */

function econnrefused (err, res) {
  return err && err.code === 'ECONNREFUSED';
}

/**
 * Timeout detection
 */

function etimedout (err, res) {
  return err && err.code === 'ETIMEDOUT';
}


/**
 * Can't get address info
 */

function eaddrinfo (err, res) {
  return err && err.code === 'EADDRINFO';
}


/**
 * Socket timeout detection
 */

function esockettimedout (err, res) {
  return err && err.code === 'ESOCKETTIMEDOUT';
}

/**
 * Superagent crossDomain error
 */

function crossDomain (err, res) {
  return err && err.crossDomain;
}

/**
 * Internal server error
 */

function internal (err, res) {
  return res && res.status === 500;
}

/**
 * Bad gateway error detection
 */

function gateway (err, res) {
  return res && [502,503,504].indexOf(res.status) !== -1;
}


/**
 * Superagent timeout errors
 */

function timeout (err, res) {
  return err && /^timeout of \d+ms exceeded$/.test(err.message);
}
