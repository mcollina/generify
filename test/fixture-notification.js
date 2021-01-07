'use strict'

const generify = require('..')
const t = require('tap')
const test = t.test
const walker = require('walker')
const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')
const base = path.join(__dirname, 'fixtures')

const testRun = 'fixture-notification-' + new Date().getTime()
const fixtures = fs.readdirSync(base).filter((d) => !d.match(/expected$/))

t.plan(fixtures.length)
fixtures.forEach(setup)

function setup (fixture) {
  let expectedPath = path.join(base, fixture + '-expected')

  fs.stat(expectedPath, (err, stat) => {
    if (err || !stat || !stat.isDirectory()) {
      expectedPath = path.join(base, fixture)
    }
    prepareExpectedData(expectedPath, fixture, createTest)
  })
}

function prepareExpectedData (path, fixture, cb) {
  const expected = {}
  const files = []
  let count = 0

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
  test(fixture, function (t) {
    t.plan(Object.keys(expected).length * 3 + 4)
    t.error(err)

    const dest = path.join(process.cwd(), 'test-runs', testRun, fixture)
    const data = {
      hello: 'hello world',
      testfilename: 'newname',
      testdirname: 'newdir',
      nested: {
        bar: 'nest hello world'
      }
    }

    if (fixture === 'init') {
      data.copyAsNamed = ['__init__.py']
    }
    if (fixture === 'transforms') {
      data.transforms = {
        foo: (d, ctx) => {
          if (ctx.dest.endsWith('b')) return d
          return d.toUpperCase()
        }
      }
      data.foo = 'foo'
    }

    if (fixture === 'nested') {
      data.foo = { more: { nesting: 'oh gee' } }
    }

    const expectedSet = new Set(Object.keys(expected).map(f => f.replace(/^[/\\]+/, '')))

    function onFile (file) {
      t.ok(expectedSet.has(file))
      expectedSet.delete(file)
    }

    generify(path.join(base, fixture), dest, data, onFile, function (err) {
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
          t.equal(expectedSet.length || 0, 0)
          rimraf(dest, function (err) {
            t.notOk(err, 'no error in deleting everything')
          })
        })
    })
  })
}
