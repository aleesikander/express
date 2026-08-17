'use strict'

if (require.main === module) {
  run().catch(function (error) {
    console.error('[child-node-https-error] ' + error.message)
    process.exitCode = 1
  })
}

function run() {
  var https = require('node:https')
  var maximumBodySize = 1024 * 1024
  var timeout = 10000
  var options = {
    hostname: 'example.com',
    port: 443,
    path: '/',
    method: 'GET',
    rejectUnauthorized: true
  }

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

    var request = https.request(options, function (response) {
      var body = ''
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

        body += chunk.toString('utf8')
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
          requireValue(body.includes('Example Domain'),
            'response body marker was absent')
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
            bodyMarker: true,
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
    request.setTimeout(timeout)

    deadline = setTimeout(function () {
      var error = new Error('request exceeded 10-second deadline')
      request.destroy(error)
      fail(error)
    }, timeout)

    request.end()
  }).then(function (result) {
    console.log('[child-node-https-transport] pid=%s ppid=%s remote_address=%s remote_port=%s tls_authorized=%s cert_cn=%s',
      process.pid, process.ppid, result.transport.remoteAddress,
      result.transport.remotePort, result.transport.authorized,
      result.transport.certificateCommonName)
    console.log('[child-node-https-response] host=example.com status=%s body_marker=%s success=true',
      result.status, result.bodyMarker)
  })
}

function requireValue(condition, message) {
  if (!condition) throw new Error(message)
}
