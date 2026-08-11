'use strict'

var https = require('node:https')
var Buffer = require('node:buffer').Buffer

var expectedMarker = 'Reserved Top Level DNS Names'
var maxBodyBytes = 1024 * 1024
var completed = false
var response
var body = ''
var bodyBytes = 0
var request = https.get({
  hostname: 'www.rfc-editor.org',
  port: 443,
  path: '/rfc/rfc2606.txt',
  method: 'GET',
  rejectUnauthorized: true,
  servername: 'www.rfc-editor.org'
}, function (incoming) {
  response = incoming
  incoming.setEncoding('utf8')

  incoming.on('data', function (chunk) {
    bodyBytes += Buffer.byteLength(chunk)
    if (bodyBytes > maxBodyBytes) {
      return fail('response body exceeded ' + maxBodyBytes + ' bytes')
    }

    body += chunk
  })
  incoming.once('aborted', function () {
    fail('response was aborted')
  })
  incoming.once('error', function (err) {
    fail('response error: ' + err.message)
  })
  incoming.once('end', function () {
    if (incoming.statusCode !== 200) {
      return fail('unexpected HTTP status ' + incoming.statusCode)
    }

    if (!body.includes(expectedMarker)) {
      return fail('response body did not contain "' + expectedMarker + '"')
    }

    succeed(incoming.statusCode)
  })
})
var absoluteTimer = setTimeout(function () {
  fail('request timed out after 10000ms')
}, 10000)

request.once('error', function (err) {
  fail('request error: ' + err.message)
})

function succeed (statusCode) {
  if (completed) return
  completed = true
  clearTimeout(absoluteTimer)
  console.log('[garnet-http-canary] host=www.rfc-editor.org status=' + statusCode + ' body_marker=true')
  process.exitCode = 0
}

function fail (message) {
  if (completed) return
  completed = true
  clearTimeout(absoluteTimer)
  console.error('[garnet-http-canary] ' + message)
  process.exitCode = 1
  request.destroy()
  if (response) response.destroy()
}
