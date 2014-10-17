var generify  = require('./')
  , test      = require('tape')
  , walker    = require('walker')
  , fs        = require('fs')
  , path      = require('path')
  , osenv     = require('osenv')
  , base      = './fixture'


fs.readdir('./fixture', function(err, fixtures) {
  if (err) {
    console.log(err)
    process.exit(1)
  }

  fixtures.forEach(setup)
});

function setup(fixture) {
  if (fixture.match(/expected$/))
    return

  var expectedPath = path.join(base, fixture + '-expected')

  fs.stat(expectedPath, function(err, stat) {
    if (!stat || !stat.isDirectory()) {
      expectedPath = path.join(base, fixture)
    }
    prepareExpectedData(expectedPath, fixture, createTest)
  })
}

function prepareExpectedData(path, fixture, cb) {
  var expected = {}
    , files    = []
    , count    = 0

  walker(path)
    .on('file', function(file) {
      files.push(file)
    })
    .on('end', function() {
      files.forEach(function(file) {
        fs.readFile(file, function(err, data) {
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

function createTest(err, expected, fixture) {
  if (err) {
    console.log(err)
    process.exit(1)
  }

  test(fixture, function(t) {
    t.plan(Object.keys(expected).length + 1)

    var dest = path.join(osenv.tmpdir(), 'generify', fixture)
      , data = { hello: 'hello world' }

    generify(path.join(base, fixture), dest, data, function(err) {
      t.notOk(err, 'no error')
      walker(dest)
        .on('file', function(file) {
          fs.readFile(file, function(err, data) {
            file = file.replace(dest, '')
            t.deepEqual(data.toString(), expected[file], file + ' not matching');
          })
        })
    })
  })
}
