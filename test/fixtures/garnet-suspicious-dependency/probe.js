'use strict'

var tls = require('node:tls')

var completed = false
var dwellTimer
var socket = tls.connect({
  host: 'example.com',
  port: 443,
  rejectUnauthorized: true,
  servername: 'example.com'
})
var absoluteTimer = setTimeout(function () {
  complete(1)
}, 4250)

socket.once('secureConnect', function () {
  if (!socket.authorized) return complete(1)

  dwellTimer = setTimeout(function () {
    complete(0)
  }, 3000)
})
socket.once('error', function () {
  complete(1)
})
socket.once('close', function () {
  complete(1)
})

function complete (code) {
  if (completed) return
  completed = true
  clearTimeout(absoluteTimer)
  clearTimeout(dwellTimer)
  process.exitCode = code
  socket.destroy()
}
