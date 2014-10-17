
var walker    = require('walker')
  , fs        = require('fs')
  , path      = require('path')
  , split     = require('split2')
  , mkdirp    = require('mkdirp')

function generify(source, dest, data, done) {
  var count   = 1 // the walker counts as 1
    , keys    = Object.keys(data)

  // needed for the path replacing to work
  source = path.resolve(source)

  walker(source)
    .on('file', function(file) {
      var relativePath = file.replace(source, '')
        , destFile = path.join(dest, relativePath)

      count++

      mkdirp(path.dirname(destFile), function(err) {
        if (err) return done(err)

        copyAndReplace(file, destFile)
      })
    })
    .on('end', complete)
    .on('error', done)

  function copyAndReplace(source, dest) {
    fs.createReadStream(source)
      .pipe(split(replaceLine))
      .pipe(fs.createWriteStream(dest))
      .on('finish', complete)
  }

  function replaceLine(line) {
    keys.forEach(function(key) {
      line = line.replace('__' + key + '__', data[key])
    })
    return line + '\n'
  }

  function complete() {
    count--
    if (count === 0)
      done()
  }
}

module.exports = generify
