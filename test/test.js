var express     = require('express')
  , agent       = require('superagent')
  , should      = require('should')
  , assert      = require('assert')
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

  describe('500 errors', function () {
    var requests = 0
      , port = 10410
      , app = express()
      , server;

    before(function (done) {
      app.get('/', function (req, res, next) {
        requests++;
        if (requests < 4) res.send(500);
        else res.send('hello!');
      });

      server = app.listen(port, done);
    });

    it('should retry on errors', function (done) {

      agent
        .get('http://localhost:' + port)
        .end(function (err, res) {
          res.status.should.eql(500);
        });

      setTimeout(function () {
        agent
          .get('http://localhost:' + port)
          .retry(5)
          .end(function (err, res) {
            console.log('requests', requests)
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
        .timeout(2)
        .retry(20)
        .end(function (err, res) {
          res.text.should.eql('hello!');
          done();
        });
    });

    it('should retry with the same headers', function(done){
      var url = 'http://localhost:' + port + '/headers';
      var requests = 0;

      app.get('/headers', function(req, res){
        if (++requests > 3) return res.send(req.headers);
      });

      agent
        .get(url)
        .set('Accept', 'application/json')
        .set('X-Foo', 'baz')
        .timeout(10)
        .retry(4)
        .end(function(err, res){
          assert('baz' == res.body['x-foo']);
          assert('application/json' == res.body['accept']);
          done();
        });
    })

    it('should re-send data and headers correctly', function(done){
      var url = 'http://localhost:' + port + '/data';
      var requests = 0;

      app.post('/data', express.bodyParser(), function(req, res){
        if (++requests < 3) return;
        res.send({ body: req.body, headers: req.headers });
      });

      agent
        .post(url)
        .type('json')
        .send({ data: 1 })
        .timeout(10)
        .retry(4)
        .end(function(err, res){
          assert(1 == res.body.body.data);
          assert('application/json' == res.body.headers['content-type']);
          done();
        });
    })

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

    it('should retry with the same querystring', function(done){
      var requests = 0;

      app.get('/qs-data', function(req, res){
        if (++requests > 10) return res.json({ foo: req.query.foo });
        res.setTimeout(1);
      });

      var url = 'http://localhost:' + port + '/qs-data';

      agent
        .get(url)
        .retry(20)
        .query({ foo: 'bar' })
        .end(function(err, res){
          res.body.foo.should.eql('bar');
          done();
        })
    });
  });
})
