'use strict'

var assert = require('node:assert')
var { execFile } = require('node:child_process')
var path = require('node:path')

describe('AWS STS from a child Node process', function () {
  this.timeout(20000)

  it('receives a service response in a separate process', function (done) {
    var fixturePath = path.join(__dirname,
      '../fixtures/child-node-aws-sts-client.js')

    console.log('[aws-child-parent] pid=%s', process.pid)

    execFile(process.execPath, [fixturePath], {
      maxBuffer: 1024 * 1024,
      timeout: 18000,
      windowsHide: true
    }, function (error, stdout, stderr) {
      if (stdout) process.stdout.write(stdout)
      if (stderr) process.stderr.write(stderr)
      if (error) return done(error)

      try {
        var match = stdout.match(/^\[child-aws-sts-runtime\] pid=(\d+) ppid=(\d+) service=sts region=us-east-1 http_status=(\d+) request_id=(\S+) attempts=1 server_response=true$/m)
        assert.ok(match, 'expected child AWS STS success proof')
        assert.notStrictEqual(Number(match[1]), process.pid)
        assert.strictEqual(Number(match[2]), process.pid)
        done()
      } catch (assertionError) {
        done(assertionError)
      }
    })
  })
})
