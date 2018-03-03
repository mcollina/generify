'use strict'

const generify = require('./')
const test = require('tap').test
const walker = require('walker')
const fs = require('fs')
const path = require('path')
const osenv = require('osenv')
const rimraf = require('rimraf')
const base = './fixture'

fs.readdir('./fixture', function (err, fixtures) {
  if (err) {
    console.log(err)
    process.exit(1)
  }

  fixtures.forEach(setup)
})

function setup (fixture) {
  if (fixture.match(/expected$/)) { return }

  var expectedPath = path.join(base, fixture + '-expected')

  fs.stat(expectedPath, function (err, stat) {
    if (err || !stat || !stat.isDirectory()) {
      expectedPath = path.join(base, fixture)
    }
    prepareExpectedData(expectedPath, fixture, createTest)
  })
}

function prepareExpectedData (path, fixture, cb) {
  var expected = {}
  var files = []
  var count = 0

  walker(path)
    .on('file', function (file) {
      files.push(file)
    })
    .on('end', function () {
      files.forEach(function (file) {
        fs.readFile(file, function (err, data) {
          if (err) {
            return cb(err)
          }

          expected[file.replace(path, '')] = data.toString()

          count++
          if (count === files.length) {
            cb(null, expected, fixture)
          }
        })
      })
    })
    .on('error', cb)
}

function createTest (err, expected, fixture) {
  if (err) {
    console.log(err)
    process.exit(1)
  }

  test(fixture, function (t) {
    t.plan(Object.keys(expected).length * 2 + 2)

    var dest = path.join(osenv.tmpdir(), 'generify', fixture)
    var data = { hello: 'hello world' }

    generify(path.join(base, fixture), dest, data, function (err) {
      t.notOk(err, 'no error')
      walker(dest)
        .on('file', function (file) {
          fs.readFile(file, function (err, data) {
            t.notOk(err)
            file = file.replace(dest, '')
            t.deepEqual(data.toString(), expected[file], file + ' matching')
          })
        })
        .on('end', function () {
          rimraf(dest, function (err) {
            t.notOk(err, 'no error in deleting everything')
          })
        })
    })
  })
}
