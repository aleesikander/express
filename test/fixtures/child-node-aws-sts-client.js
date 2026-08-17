'use strict'

if (require.main === module) {
  run().catch(function (error) {
    console.error('[child-aws-sts-error] ' + error.message)
    process.exitCode = 1
  })
}

async function run() {
  var {
    GetCallerIdentityCommand,
    STSClient
  } = require('@aws-sdk/client-sts')
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

  requireValue(serviceError, 'AWS unexpectedly accepted fake credentials')

  var metadata = serviceError.$metadata
  requireValue(metadata && typeof metadata === 'object',
    'AWS service metadata was absent')
  requireValue(Number.isInteger(metadata.httpStatusCode) &&
    metadata.httpStatusCode >= 100 && metadata.httpStatusCode <= 599,
  'AWS HTTP status was absent')
  requireValue(typeof metadata.requestId === 'string' &&
    metadata.requestId.length > 0,
  'AWS request ID was absent')
  requireValue(metadata.attempts === 1,
    'AWS request attempt count was not one')

  console.log('[child-aws-sts-runtime] pid=%s ppid=%s service=sts region=us-east-1 http_status=%s request_id=%s attempts=1 server_response=true',
    process.pid, process.ppid, metadata.httpStatusCode, metadata.requestId)
}

function requireValue(condition, message) {
  if (!condition) throw new Error(message)
}
