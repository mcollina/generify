#!/usr/bin/env node

'use strict'

const walker = require('walker')
const fs = require('fs')
const path = require('path')
const split = require('split2')
const mkdirp = require('mkdirp')
const pump = require('pump')
const os = require('os')
const isBinaryFile = require('isbinaryfile')

module.exports = generify

function generify (source, dest, data, onFile, done) {
  var count = 1 // the walker counts as 1
  var keys = Object.keys(data)
  var copyFilesAsNamed = data.copyAsNamed
  if (copyFilesAsNamed) {
    delete data.copyAsNamed
  } else {
    copyFilesAsNamed = []
  }
  var transforms = data.transforms
  if (transforms) {
    delete data.transforms
  } else {
    transforms = {}
  }

  // needed for the path replacing to work
  source = path.resolve(source)

  if (typeof done !== 'function') {
    done = onFile
    onFile = function () {}
  }

  if (!data) data = {}

  walker(source)
    .on('file', function (file) {
      var relativePath
      if (copyFilesAsNamed.includes(path.basename(file))) {
        relativePath = path.relative(source, file)
      } else {
        relativePath = path.relative(source, file).replace(/^__/, '.')
      }
      var destFile = path.join(dest, relativePath)

      count++

      mkdirp(path.dirname(destFile), function (err) {
        if (err) return complete(err)

        copyAndReplace(file, destFile)
        onFile(relativePath)
      })
    })
    .on('end', complete)
    .on('error', done)

  function copyAndReplace (source, dest) {
    isBinaryFile(source, function (err, isBinary) {
      if (err) return complete(err)

      if (isBinary) {
        pump(
          fs.createReadStream(source),
          fs.createWriteStream(dest),
          complete)
      } else {
        pump(
          fs.createReadStream(source),
          split(replaceLine.bind({ source, dest })),
          fs.createWriteStream(dest),
          complete)
      }
    })
  }

  function replacer () {
    if (transforms[this.key]) {
      return transforms[this.key](data[this.key], {
        souce: this.source,
        dest: this.dest,
        key: this.key
      })
    }
    return data[this.key]
  }

  function replaceLine (line) {
    const ctx = { source: this.source, dest: this.dest }
    keys.forEach(function (key) {
      line = line.replace(
        new RegExp('__' + key + '__', 'g'),
        replacer.bind({ ...ctx, key })
      )
    })
    return line + os.EOL
  }

  function complete (err) {
    if (err) {
      count = 0
      done(err)
      return
    }

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

  generify(source, dest, json, onData, done)

  function onData (file) {
    console.log('> writing ' + file)
  }

  function done (err) {
    if (err) {
      throw err
    }
    console.log('> completed ' + dest)
  }
}

if (require.main === module) execute()
