'use strict'

var assert = require('node:assert')
var { simpleGit } = require('simple-git')

describe('public Git repository metadata', function () {
  this.timeout(20000)

  it('retrieves the HEAD reference for the Express repository', async function () {
    var remote = 'https://github.com/expressjs/express.git'
    var output = await simpleGit().listRemote([remote, 'HEAD'])

    assert.ok(output.trim())
    assert.match(output, /\sHEAD(?:\n|$)/)

    var match = output.trim().match(/^([0-9a-f]{40}|[0-9a-f]{64})\s+HEAD$/)
    assert.ok(match, 'expected a valid Git object hash for HEAD')

    console.log('[simple-git-runtime] remote=%s ref=HEAD hash=%s success=true',
      remote, match[1])
  })
})
