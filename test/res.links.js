'use strict'

var assert = require('node:assert');
var express = require('..');
var request = require('supertest');
var utils = require('./support/utils');

describe('res', function(){
  describe('.links(obj)', function(){
    it('should not set Link header field for an empty object', function (done) {
      var app = express();

      app.use(function (req, res) {
        assert.strictEqual(res.links({}), res);
        res.end();
      });

      request(app)
      .get('/')
      .expect(utils.shouldNotHaveHeader('Link'))
      .expect(200, done);
    })

    it('should preserve Link header field for an empty object', function (done) {
      var app = express();

      app.use(function (req, res) {
        res.set('Link', '<http://api.example.com/users?page=1>; rel="prev"');
        assert.strictEqual(res.links({}), res);
        res.end();
      });

      request(app)
      .get('/')
      .expect('Link', '<http://api.example.com/users?page=1>; rel="prev"')
      .expect(200, done);
    })

    it('should set Link header field', function (done) {
      var app = express();

      app.use(function (req, res) {
        res.links({
          next: 'http://api.example.com/users?page=2',
          last: 'http://api.example.com/users?page=5'
        });
        res.end();
      });

      request(app)
      .get('/')
      .expect('Link', '<http://api.example.com/users?page=2>; rel="next", <http://api.example.com/users?page=5>; rel="last"')
      .expect(200, done);
    })

    it('should set Link header field for multiple calls', function (done) {
      var app = express();

      app.use(function (req, res) {
        res.links({
          next: 'http://api.example.com/users?page=2',
          last: 'http://api.example.com/users?page=5'
        });

        res.links({
          prev: 'http://api.example.com/users?page=1'
        });

        res.end();
      });

      request(app)
      .get('/')
      .expect('Link', '<http://api.example.com/users?page=2>; rel="next", <http://api.example.com/users?page=5>; rel="last", <http://api.example.com/users?page=1>; rel="prev"')
      .expect(200, done);
    })

    it('should set multiple links for single rel', function (done) {
      var app = express();

      app.use(function (req, res) {
        res.links({
          next: 'http://api.example.com/users?page=2',
          last: ['http://api.example.com/users?page=5', 'http://api.example.com/users?page=1']
        });

        res.end();
      });

      request(app)
      .get('/')
      .expect('Link', '<http://api.example.com/users?page=2>; rel="next", <http://api.example.com/users?page=5>; rel="last", <http://api.example.com/users?page=1>; rel="last"')
      .expect(200, done);
    })
  })
})
