'use strict'

var { Buffer } = require('node:buffer')
var https = require('node:https')

run().catch(function (error) {
  console.error('[dedicated-direct-node-error] ' + error.message)
  process.exitCode = 1
})

async function run() {
  requireValue(Number.isInteger(process.pid) && process.pid > 0,
    'process PID was unavailable')
  requireValue(Number.isInteger(process.ppid) && process.ppid > 0,
    'process PPID was unavailable')

  var result = await requestExampleDomain()

  console.log('[dedicated-direct-node-transport] pid=%s ppid=%s remote_address=%s remote_port=%s tls_authorized=%s cert_cn=%s',
    process.pid, process.ppid, result.transport.remoteAddress,
    result.transport.remotePort, result.transport.authorized,
    result.transport.certificateCommonName)
  console.log('[dedicated-direct-node-response] pid=%s ppid=%s host=example.com status=%s body_marker=%s success=true',
    process.pid, process.ppid, result.status, result.bodyMarker)
}

function requestExampleDomain() {
  var maximumBodySize = 1024 * 1024
  var timeout = 10000

  return new Promise(function (resolve, reject) {
    var settled = false
    var deadline
    var transport

    function fail(error) {
      if (settled) return
      settled = true
      clearTimeout(deadline)
      reject(error)
    }

    function succeed(value) {
      if (settled) return
      settled = true
      clearTimeout(deadline)
      resolve(value)
    }

    var request = https.request({
      hostname: 'example.com',
      port: 443,
      path: '/',
      method: 'GET',
      rejectUnauthorized: true,
      timeout: timeout
    }, function (response) {
      var chunks = []
      var bodySize = 0

      response.on('data', function (chunk) {
        bodySize += chunk.length

        if (bodySize > maximumBodySize) {
          var error = new Error('response body exceeded 1 MiB')
          response.destroy(error)
          request.destroy(error)
          fail(error)
          return
        }

        chunks.push(chunk)
      })

      response.once('aborted', function () {
        fail(new Error('response was aborted'))
      })

      response.once('error', fail)

      response.once('end', function () {
        if (settled) return

        try {
          requireValue(response.complete, 'response did not complete')
          requireValue(response.statusCode === 200,
            'unexpected HTTP status: ' + response.statusCode)
          var bodyMarker = Buffer.concat(chunks)
            .toString('utf8')
            .includes('Example Domain')
          requireValue(bodyMarker, 'response body marker was absent')
          requireValue(transport, 'TLS transport evidence was unavailable')
          requireValue(transport.remoteAddress,
            'remote address was unavailable')
          requireValue(transport.remotePort === 443,
            'unexpected remote port: ' + transport.remotePort)
          requireValue(transport.authorized === true,
            'TLS connection was not authorized')
          requireValue(transport.certificate,
            'peer certificate was unavailable')
          requireValue(transport.certificateCommonName,
            'peer certificate common name was unavailable')

          succeed({
            bodyMarker: bodyMarker,
            status: response.statusCode,
            transport: transport
          })
        } catch (error) {
          fail(error)
        }
      })
    })

    request.once('socket', function (socket) {
      socket.once('secureConnect', function () {
        var certificate = socket.getPeerCertificate()

        transport = {
          remoteAddress: socket.remoteAddress,
          remotePort: socket.remotePort,
          authorized: socket.authorized,
          certificate: certificate && Object.keys(certificate).length > 0,
          certificateCommonName: certificate && certificate.subject
            ? certificate.subject.CN
            : undefined
        }
      })
    })

    request.once('timeout', function () {
      request.destroy(new Error('request timed out'))
    })

    request.once('error', fail)

    deadline = setTimeout(function () {
      var error = new Error('request exceeded 10-second deadline')
      request.destroy(error)
      fail(error)
    }, timeout)

    request.end()
  })
}

function requireValue(condition, message) {
  if (!condition) throw new Error(message)
}
