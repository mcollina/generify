'use strict'

const generify = require('./')
const source = './fixture/template'
const dest = '/tmp/generify'
const data = { hello: 'hello world' }

generify(source, dest, data, function (err) {
  if (err) { console.log(err) } else { console.log('ok!') }
})
