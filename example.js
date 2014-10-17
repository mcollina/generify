
var generify  = require('./')
  , source    = './fixture/template'
  , dest      = '/tmp/generify'
  , data      = { hello: 'hello world' }

generify(source, dest, data, function(err) {
  if (err)
    console.log(err)
  else
    console.log('ok!')
})
