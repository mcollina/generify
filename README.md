# generify

A reusable project generator that _copies file recursively_, while
replacing keywords from passed data.

## Example

```js
'use strict'

const generify = require('generify')
const source = './template'
const dest = '/tmp/generify-test'
const data = { hello: 'hello world' }

generify(source, dest, data, function(err) {
  if (err) {
    console.log(err)
  } else {
    console.log('ok!')
  }
})
```

This will replace all the `__hello__` patterns found in all files
with the `'hello world'` string.

### `__` handling

If a file begins with `__` that will be automatically converted into a
`.`. This is useful for generating `.gitignore` files, as on NPM a
`.gitignore` file will be automatically converted into a `.npmignore`.

## Executable

__generify__ also offers an executable that can be called with:

  Usage: generify template destination [json file]

Where the json file contains the data to be replaced.

## Acknowledgements

This project was kindly sponsored by [nearForm](http://nearform.com).

## License

MIT
