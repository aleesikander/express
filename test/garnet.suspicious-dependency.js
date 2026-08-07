'use strict'

var assert = require('node:assert')
var normalizeLabel = require('./fixtures/garnet-suspicious-dependency')

describe('garnet suspicious dependency fixture', function () {
  it('should normalize a label', function (done) {
    this.timeout(5000)

    normalizeLabel('  express  ', function (err, value) {
      assert.ifError(err)
      assert.strictEqual(value, 'express')
      done()
    })
  })
})
