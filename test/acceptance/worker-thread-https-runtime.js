'use strict'

var assert = require('node:assert')
var path = require('node:path')
var { Worker, threadId } = require('node:worker_threads')

describe('public example domain from a Worker Thread', function () {
  this.timeout(20000)

  it('retrieves the Example Domain page in the same process', async function () {
    var fixturePath = path.join(__dirname,
      '../fixtures/worker-thread-https-client.js')

    console.log('[worker-parent] pid=%s', process.pid)

    var result = await new Promise(function (resolve, reject) {
      var settled = false
      var workerResult
      var messageCount = 0
      var worker = new Worker(fixturePath)
      var workerThreadId = worker.threadId
      var timer = setTimeout(function () {
        worker.terminate()
        fail(new Error('Worker exceeded 15-second deadline'))
      }, 15000)

      function fail(error) {
        if (settled) return
        settled = true
        clearTimeout(timer)
        reject(error)
      }

      function succeed(value) {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolve(value)
      }

      worker.on('message', function (message) {
        messageCount += 1
        workerResult = message
      })

      worker.once('error', fail)

      worker.once('exit', function (code) {
        if (settled) return

        try {
          assert.strictEqual(code, 0)
          assert.strictEqual(messageCount, 1)
          assert.ok(workerResult)
          assert.strictEqual(workerResult.success, true)
          assert.strictEqual(workerResult.pid, process.pid)
          assert.strictEqual(threadId, 0)
          assert.ok(workerResult.threadId > 0)
          assert.notStrictEqual(workerResult.threadId, threadId)
          assert.strictEqual(workerResult.threadId, workerThreadId)
          succeed(workerResult)
        } catch (error) {
          fail(error)
        }
      })
    })

    assert.strictEqual(result.pid, process.pid)
  })
})
