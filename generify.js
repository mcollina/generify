#!/usr/bin/env node

'use strict'

const walker = require('walker')
const fs = require('fs')
const path = require('path')
const split = require('split2')
const mkdirp = require('mkdirp')
const pump = require('pump')
const os = require('os')
const { isBinaryFile } = require('isbinaryfile')

module.exports = generify

function generify (source, dest, data, onFile, done) {
  var count = 1 // the walker counts as 1
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
    isBinaryFile(source).then(function (isBinary) {
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
    }, complete)
  }

  function replacer () {
    if (transforms[this.key]) {
      return transforms[this.key](getNestedValue(data, this.key), {
        souce: this.source,
        dest: this.dest,
        key: this.key
      })
    }
    return getNestedValue(data, this.key)
  }

  function replaceLine (line) {
    const ctx = { source: this.source, dest: this.dest }
    const matches = matchAll(line, /__([a-zA-Z/\\.]*?)__/g)
    for (const match of matches) {
      line = line.replace(
        new RegExp('__' + match[1] + '__', 'g'),
        replacer.bind({ ...ctx, key: match[1] })
      )
    }
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

/**
 * Added for support of node versions < 12, since String.prototype.matchAll is only node >= 12
 */
function * matchAll (str, regexp) {
  const flags = regexp.global ? regexp.flags : regexp.flags + 'g'
  const re = new RegExp(regexp, flags)
  let match
  while ((match = re.exec(str))) {
    yield match
  }
}

function getNestedValue (obj, key) {
  return key.split('.').reduce(function (result, key) {
    if (!result || !key) {
      return 'notFound'
    }
    return result[key]
  }, obj)
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
