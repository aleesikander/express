'use strict'

var https = require('node:https')

var completed = false
var request = https.request('https://example.com/', {
  agent: false,
  method: 'HEAD'
}, function (response) {
  response.once('error', complete)
  response.once('end', complete)
  response.resume()
})
var timer = setTimeout(function () {
  request.destroy()
  complete()
}, 1500)

request.once('error', complete)
request.end()

function complete () {
  if (completed) return
  completed = true
  clearTimeout(timer)
  process.exitCode = 0
}
