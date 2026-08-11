'use strict'

var assert = require('node:assert')
var normalizeLabel = require('./fixtures/garnet-http-response')

describe('garnet HTTP response fixture', function () {
  it('should normalize a label', function (done) {
    this.timeout(15000)

    if (process.env.GITHUB_ACTIONS !== 'true' ||
        process.platform !== 'linux' ||
        process.versions.node.split('.')[0] !== '24') {
      return this.skip()
    }

    normalizeLabel('  express  ', function (err, value) {
      if (err) return done(err)

      try {
        assert.strictEqual(value, 'express')
        done()
      } catch (error) {
        done(error)
      }
    })
  })
})
