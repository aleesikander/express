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
    var responseEvent
    var serviceError

    stripe.once('response', function (response) {
      responseEvent = response
    })

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
    assert.ok(responseEvent && typeof responseEvent === 'object',
      'Stripe response event was absent')
    assert.strictEqual(responseEvent.method, 'GET')
    assert.strictEqual(responseEvent.path, '/v1/balance')
    assert.ok(Number.isInteger(responseEvent.status) &&
      responseEvent.status >= 400 && responseEvent.status <= 599,
    'Stripe response event HTTP status was absent')
    assert.ok(Number.isInteger(serviceError.statusCode) &&
      serviceError.statusCode >= 400 && serviceError.statusCode <= 599,
    'Stripe HTTP status was absent')
    assert.strictEqual(serviceError.statusCode, responseEvent.status)
    assert.ok(serviceError.headers && typeof serviceError.headers === 'object',
      'Stripe response headers were absent')

    console.log('[stripe-runtime] host=api.stripe.com http_status=%s error_type=%s server_response=true retries=0',
      serviceError.statusCode, serviceError.type)
  })
})
