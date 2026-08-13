'use strict'

var assert = require('node:assert')
var { Buffer } = require('node:buffer')
var https = require('node:https')

describe('public example domain with Node HTTPS', function () {
  this.timeout(15000)

  it('retrieves the Example Domain page', async function () {
    var maximumBodySize = 1024 * 1024
    var timeout = 10000
    var options = {
      hostname: 'example.com',
      port: 443,
      path: '/',
      method: 'GET',
      rejectUnauthorized: true,
      timeout: timeout
    }

    var result = await new Promise(function (resolve, reject) {
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
            assert.strictEqual(response.complete, true)
            assert.strictEqual(response.statusCode, 200)

            var bodyMarker = Buffer.concat(chunks)
              .toString('utf8')
              .includes('Example Domain')
            assert.strictEqual(bodyMarker, true)

            assert.ok(transport)
            assert.ok(transport.remoteAddress)
            assert.ok(transport.remotePort)
            assert.strictEqual(transport.authorized, true)
            assert.ok(transport.certificateCommonName)
            assert.ok(transport.certificateSubjectAltName)

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
            certificateCommonName: certificate && certificate.subject
              ? certificate.subject.CN
              : undefined,
            certificateSubjectAltName: certificate
              ? certificate.subjectaltname
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

    console.log('[example-node-https-runtime-transport] remote_address=%s remote_port=%s tls_authorized=%s cert_cn=%s cert_san=%s',
      result.transport.remoteAddress,
      result.transport.remotePort,
      result.transport.authorized,
      result.transport.certificateCommonName,
      result.transport.certificateSubjectAltName)
    console.log('[example-node-https-runtime-response] host=%s status=%d body_marker=%s',
      options.hostname, result.status, result.bodyMarker)
  })
})
