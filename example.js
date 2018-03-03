'use strict'

var generify = require('./')
var source = './fixture/template'
var dest = '/tmp/generify'
var data = { hello: 'hello world' }

generify(source, dest, data, function (err) {
  if (err) { console.log(err) } else { console.log('ok!') }
})
