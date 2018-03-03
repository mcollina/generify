#!/usr/bin/env node

'use strict'

var walker = require('walker')
var fs = require('fs')
var path = require('path')
var split = require('split2')
var mkdirp = require('mkdirp')

module.exports = generify

if (require.main === module) execute()

function generify (source, dest, data, done) {
  var count = 1 // the walker counts as 1
  var keys = Object.keys(data)

  // needed for the path replacing to work
  source = path.resolve(source)

  if (!done) done = function () {}
  if (!data) data = {}

  walker(source)
    .on('file', function (file) {
      var relativePath = path.relative(source, file).replace(/^__/, '.')
      var destFile = path.join(dest, relativePath)

      count++

      mkdirp(path.dirname(destFile), function (err) {
        if (err) return done(err)

        copyAndReplace(file, destFile)
      })
    })
    .on('end', complete)
    .on('error', done)

  function copyAndReplace (source, dest) {
    fs.createReadStream(source)
      .pipe(split(replaceLine))
      .pipe(fs.createWriteStream(dest))
      .on('finish', complete)
  }

  function replaceLine (line) {
    keys.forEach(function (key) {
      line = line.replace('__' + key + '__', data[key])
    })
    return line + '\n'
  }

  function complete () {
    count--
    if (count === 0) { done() }
  }
}

function execute () {
  if (process.argv.length < 4) {
    console.log('Usage: generify template destination [json file]')
    process.exit(1)
  }

  var source = process.argv[2]
  var dest = process.argv[3]
  var json = {}

  if (process.argv[4]) {
    json = JSON.parse(fs.readFileSync(process.argv[4]))
  }

  generify(source, dest, json)
}
