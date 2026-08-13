'use strict'

var assert = require('node:assert')
var axios = require('axios')

describe('public repository metadata', function () {
  it('retrieves metadata for the Express repository', async function () {
    this.timeout(15000)

    var response = await axios.get('https://api.github.com/repos/expressjs/express', {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'express-repository-metadata-test',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      maxContentLength: 1024 * 1024,
      maxRedirects: 0,
      timeout: 10000,
      validateStatus: function () {
        return true
      }
    })

    assert.strictEqual(response.status, 200)
    assert.match(response.headers['content-type'], /^application\/json\b/)
    assert.strictEqual(response.data.full_name, 'expressjs/express')
    assert.strictEqual(response.data.name, 'express')
    assert.strictEqual(response.data.owner.login, 'expressjs')
    assert.strictEqual(response.data.private, false)
    assert.strictEqual(response.data.html_url, 'https://github.com/expressjs/express')

    var requestId = response.headers.get('x-github-request-id')
    var socket = response.request && response.request.socket
    var certificate = socket && typeof socket.getPeerCertificate === 'function'
      ? socket.getPeerCertificate()
      : null
    var certificateCommonName = certificate && certificate.subject
      ? certificate.subject.CN
      : undefined
    var certificateSubjectAltName = certificate
      ? certificate.subjectaltname
      : undefined

    console.log('[repository-metadata] requested=%s status=%d full_name=%s github_request_id=%s',
      response.config.url, response.status, response.data.full_name, requestId)
    console.log('[repository-transport] remote_address=%s remote_port=%s tls_authorized=%s cert_cn=%s cert_san=%s',
      socket && socket.remoteAddress,
      socket && socket.remotePort,
      socket && socket.authorized,
      certificateCommonName,
      certificateSubjectAltName)
  })
})
