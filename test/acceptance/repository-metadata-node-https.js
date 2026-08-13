'use strict'

var assert = require('node:assert')
var { Buffer } = require('node:buffer')
var https = require('node:https')

describe('public repository metadata with Node HTTPS', function () {
  it('retrieves metadata for the Express repository', async function () {
    this.timeout(15000)

    var maximumBodySize = 1024 * 1024
    var timeout = 10000
    var options = {
      hostname: 'api.github.com',
      port: 443,
      path: '/repos/expressjs/express',
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'express-node-https-runtime-test',
        'X-GitHub-Api-Version': '2022-11-28'
      },
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

            var contentType = String(response.headers['content-type'] || '')
            assert.match(contentType, /^application\/json\b/i)

            var data = JSON.parse(Buffer.concat(chunks).toString('utf8'))
            assert.strictEqual(data.full_name, 'expressjs/express')
            assert.strictEqual(data.name, 'express')
            assert.strictEqual(data.owner.login, 'expressjs')
            assert.strictEqual(data.private, false)
            assert.strictEqual(data.html_url, 'https://github.com/expressjs/express')

            assert.ok(transport)
            assert.ok(transport.remoteAddress)
            assert.ok(transport.remotePort)
            assert.strictEqual(transport.authorized, true)

            var requestId = response.headers['x-github-request-id']
            assert.ok(typeof requestId === 'string' && requestId.length > 0)

            succeed({
              data: data,
              requestId: requestId,
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

    console.log('[node-https-runtime-transport] remote_address=%s remote_port=%s tls_authorized=%s cert_cn=%s cert_san=%s',
      result.transport.remoteAddress,
      result.transport.remotePort,
      result.transport.authorized,
      result.transport.certificateCommonName,
      result.transport.certificateSubjectAltName)
    console.log('[node-https-runtime-metadata] host=%s status=%d full_name=%s github_request_id=%s',
      options.hostname, result.status, result.data.full_name, result.requestId)
  })
})
