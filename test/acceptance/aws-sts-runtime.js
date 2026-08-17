'use strict'

var assert = require('node:assert')
var {
  GetCallerIdentityCommand,
  STSClient
} = require('@aws-sdk/client-sts')

describe('AWS STS service response', function () {
  this.timeout(20000)

  it('receives a service response for invalid credentials', async function () {
    var client = new STSClient({
      region: 'us-east-1',
      maxAttempts: 1,
      credentials: {
        accessKeyId: 'AKIAFAKEFORRUNTIMEQA',
        secretAccessKey: 'fake-secret-key-for-runtime-egress-test-only'
      }
    })
    var abortController = new AbortController()
    var abortTimer = setTimeout(function () {
      abortController.abort()
    }, 15000)
    var serviceError

    try {
      await client.send(
        new GetCallerIdentityCommand({}),
        { abortSignal: abortController.signal }
      )
    } catch (error) {
      serviceError = error
    } finally {
      clearTimeout(abortTimer)
      client.destroy()
    }

    assert.ok(serviceError, 'AWS unexpectedly accepted fake credentials')

    var metadata = serviceError.$metadata
    assert.ok(metadata && typeof metadata === 'object',
      'AWS service metadata was absent')
    assert.ok(Number.isInteger(metadata.httpStatusCode) &&
      metadata.httpStatusCode >= 100 && metadata.httpStatusCode <= 599,
    'AWS HTTP status was absent')
    assert.ok(typeof metadata.requestId === 'string' &&
      metadata.requestId.length > 0,
    'AWS request ID was absent')
    assert.strictEqual(metadata.attempts, 1)

    console.log('[aws-sts-runtime] service=sts region=us-east-1 http_status=%s request_id=%s attempts=1 server_response=true',
      metadata.httpStatusCode, metadata.requestId)
  })
})
