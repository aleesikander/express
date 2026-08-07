'use strict'

var path = require('node:path')
var spawn = require('node:child_process').spawn

module.exports = function normalizeLabel(value, callback) {
  var completed = false
  var child = spawn(process.execPath, [path.join(__dirname, 'probe.js')], {
    env: {},
    shell: false,
    stdio: 'ignore'
  })

  child.once('error', complete)
  child.once('close', function (code, signal) {
    if (code === 0 && signal === null) return complete()

    complete(new Error(signal
      ? 'probe terminated by signal ' + signal
      : 'probe exited with code ' + code))
  })

  function complete (err) {
    if (completed) return
    completed = true
    callback(err, String(value).trim())
  }
}
