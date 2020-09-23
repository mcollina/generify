# generify&nbsp;&nbsp;![Build Status](https://github.com/mcollina/generify/workflows/ci/badge.svg)

A reusable project generator that _copies file recursively_, while
replacing keywords from passed data.

## Example

```js
'use strict'

const generify = require('generify')
const source = './template'
const dest = '/tmp/generify-test'
const data = { hello: 'hello world' }

// without notification
generify(source, dest, data, function (err) {
  if (err) {
    console.log(err)
  } else {
    console.log('ok!')
  }
})

// with notification
generify(source, dest, data, onData, done)

function onData (file) {
  console.log('writing file')
}

function done (err) {
  if (err) {
    console.log(err)
  } else {
    console.log('ok!')
  }
}
```

This will replace all the `__hello__` patterns found in all files
with the `'hello world'` string.

If the supplied `data` has a key `transforms`, with a hash of tranformation
functions, then the found tokens will be used to run a corresponding
transform on the supplied data. Example:

```js
const data = {
  transforms: { foo: (data, context) => data.toUpperCase() },
  foo: 'foo'
}

// __foo__ => foo_transform(data = 'foo') => 'FOO'
```

The `context` object contains properties: `source` (input file path),
`dest` (output file path), `key` (the matched key).

### Files and Directories

files and directories located in the template folder may also be replaced. File and folder names wrapped with `@` delimiters will be replaced.

#### Example

Given a template with:

`/template/@foo@/@bar@.txt`

and data:

```js
const data = {
  foo: 'hello',
  bar: 'world'
}
```

The outputted file will be:

`<dest>/hello/world.txt`

### `__` handling

If a file begins with `__` that will be automatically converted into a
`.`. This is useful for generating `.gitignore` files.

If the supplied `data` has a key `copyAsNamed`, with an array of names, then
the filenames in that list will not be processed through this rule. Each file
name in the list should not include a path,
e.g. `['__do-not-replace-underscores.js']`.

## Executable

__generify__ also offers an executable that can be called with:

  Usage: generify template destination [json file]

Where the json file contains the data to be replaced.

## Acknowledgements

This project was kindly sponsored by [nearForm](http://nearform.com).

## License

MIT
