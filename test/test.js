var express     = require('express')
  , agent       = require('superagent')
  , should      = require('should')
  , http        = require('http');


http.globalAgent.maxSockets = 2000;


require('../')(agent);


describe('superagent-retry', function () {

  describe('errors', function () {
    var requests = 0
      , port = 10410
      , app = express()
      , server;

    before(function (done) {
      app.get('/', function (req, res, next) {
        requests++;
        if (requests < 4) res.send(503);
        else res.send('hello!');
      });

      server = app.listen(port, done);
    });

    it('should retry on errors', function (done) {

      agent
        .get('http://localhost:' + port)
        .end(function (err, res) {
          res.status.should.eql(503);
        });

      setTimeout(function () {
        agent
          .get('http://localhost:' + port)
          .retry(5)
          .end(function (err, res) {
            res.text.should.eql('hello!');
            requests.should.eql(4);
            done(err);
          });
      }, 100);
    });

    after(function (done) { server.close(done); });
  });

  describe('resets', function () {
    var requests = 0
      , port = 10410
      , app = express()
      , server;

    before(function (done) {
      server = app.listen(port, done);
    });

    it('should retry client timeouts', function (done) {
      app.get('/client-timeouts', function (req, res, next) {
        requests++;
        if (requests > 10) res.send('hello!');
      });

      var url = 'http://localhost:' + port + '/client-timeouts';

      agent
        .get(url)
        .timeout(10)
        .end(function (err, res) {
          should.exist(err);
        });

      agent
        .get(url)
        .timeout(1)
        .retry(20)
        .end(function (err, res) {
          res.text.should.eql('hello!');
          done();
        });
    });

    it('should retry on server resets', function (done) {
      var requests = 0;

      app.get('/server-timeouts', function (req, res, next) {
        requests++;
        if (requests > 10) return res.send('hello!');
        res.setTimeout(1);
      });

      var url = 'http://localhost:' + port + '/server-timeouts';

      agent
        .get(url)
        .end(function (err, res) {
          err.code.should.eql('ECONNRESET');
        });

      agent
        .get(url)
        .retry(20)
        .end(function (err, res) {
          res.text.should.eql('hello!');
          done();
        });
    });
  });
});