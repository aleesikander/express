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

    var host = new URL(response.config.url).hostname
    console.log('[repository-metadata] host=%s status=%d full_name=%s',
      host, response.status, response.data.full_name)
  })
})
