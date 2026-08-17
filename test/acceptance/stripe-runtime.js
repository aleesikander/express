'use strict'

var assert = require('node:assert')
var Stripe = require('stripe')

describe('Stripe service response', function () {
  this.timeout(20000)

  it('receives a service response for invalid credentials', async function () {
    var stripe = new Stripe('sk_test_FAKE_RUNTIME_EGRESS_CONTROL_ONLY_000000', {
      maxNetworkRetries: 0,
      telemetry: false,
      timeout: 10000
    })
    var serviceError

    try {
      await stripe.balance.retrieve()
    } catch (error) {
      serviceError = error
    }

    assert.ok(serviceError, 'Stripe unexpectedly accepted fake credentials')
    assert.ok(serviceError instanceof Stripe.errors.StripeError,
      'Stripe service error was absent')
    assert.notStrictEqual(serviceError.type, 'StripeConnectionError')

    var serviceTypes = [
      'StripeAPIError',
      'StripeAuthenticationError',
      'StripeInvalidRequestError',
      'StripePermissionError',
      'StripeRateLimitError'
    ]
    assert.ok(serviceTypes.indexOf(serviceError.type) !== -1,
      'unexpected Stripe error type: ' + serviceError.type)
    assert.ok(Number.isInteger(serviceError.statusCode) &&
      serviceError.statusCode >= 400 && serviceError.statusCode <= 599,
    'Stripe HTTP status was absent')
    assert.ok(typeof serviceError.requestId === 'string' &&
      serviceError.requestId.length > 0,
    'Stripe request ID was absent')
    assert.ok(serviceError.headers && typeof serviceError.headers === 'object',
      'Stripe response headers were absent')
    assert.strictEqual(serviceError.headers['request-id'],
      serviceError.requestId)

    console.log('[stripe-runtime] host=api.stripe.com http_status=%s request_id=%s server_response=true retries=0',
      serviceError.statusCode, serviceError.requestId)
  })
})
