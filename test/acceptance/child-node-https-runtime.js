'use strict'

var assert = require('node:assert')
var { execFile } = require('node:child_process')
var path = require('node:path')

describe('public example domain from a child Node process', function () {
  this.timeout(20000)

  it('retrieves the Example Domain page', function (done) {
    var fixturePath = path.join(__dirname,
      '../fixtures/child-node-https-client.js')

    console.log('[parent-process] pid=%s ppid=%s', process.pid, process.ppid)

    execFile(process.execPath, [fixturePath], {
      maxBuffer: 1024 * 1024,
      timeout: 15000,
      windowsHide: true
    }, function (error, stdout, stderr) {
      if (stdout) process.stdout.write(stdout)
      if (stderr) process.stderr.write(stderr)
      if (error) return done(error)

      try {
        var transportPattern = new RegExp(
          '^\\[child-node-https-transport\\] pid=\\d+ ppid=' + process.pid +
          ' remote_address=\\S+ remote_port=443 tls_authorized=true cert_cn=.+$',
          'm')
        assert.match(stdout, transportPattern)
        assert.match(stdout,
          /^\[child-node-https-response\] host=example\.com status=200 body_marker=true success=true$/m)
        done()
      } catch (assertionError) {
        done(assertionError)
      }
    })
  })
})
