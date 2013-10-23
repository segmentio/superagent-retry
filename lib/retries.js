/**
 * Common retry conditions
 */

module.exports = [
  econnreset,
  etimedout,
  eaddrinfo,
  esockettimedout,
  gateway,
  timeout
];


/**
 * Connection reset detection
 */

function econnreset (err, res) {
  return err && err.code === 'ECONNRESET';
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