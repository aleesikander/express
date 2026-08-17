'use strict'

var assert = require('node:assert')
var { execFile } = require('node:child_process')
var path = require('node:path')

run().catch(function (error) {
  console.error('[run-tests-parent-node-error] ' + error.message)
  process.exitCode = 1
})

async function run() {
  var childScriptPath = path.join(__dirname,
    'garnet-child-node-https-control.js')

  console.log('[run-tests-parent-node] pid=%s ppid=%s',
    process.pid, process.ppid)

  var output = await new Promise(function (resolve, reject) {
    execFile(process.execPath, [childScriptPath], {
      encoding: 'utf8',
      env: Object.assign({}, process.env, {
        EXPECTED_PARENT_PID: String(process.pid)
      }),
      maxBuffer: 1024 * 1024,
      timeout: 15000,
      windowsHide: true
    }, function (error, stdout, stderr) {
      if (stdout) process.stdout.write(stdout)
      if (stderr) process.stderr.write(stderr)
      if (error) {
        reject(error)
        return
      }
      resolve(stdout)
    })
  })

  var transport = output.match(/^\[run-tests-child-node-transport\] pid=(\d+) ppid=(\d+) remote_address=\S+ remote_port=443 tls_authorized=true cert_cn=.+$/m)
  assert.ok(transport, 'expected child Node transport proof')
  assert.notStrictEqual(Number(transport[1]), process.pid)
  assert.strictEqual(Number(transport[2]), process.pid)
  assert.match(output,
    /^\[run-tests-child-node-response\] host=example\.com status=200 body_marker=true success=true$/m)
}
