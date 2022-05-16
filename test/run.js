const glob = require('glob')
const path = require('path')
const tape = require('tape')
const common = require('./common')
const suite = process.argv[2] || ['unit']

// find all files ending in .test.js
const files = glob.sync('**/*.test.js', { realpath: true })

// unit and functional test predecates
const unit = (f) => !/\/test\//.test(f) && !/\/node_modules\//.test(f)
// const func = (f) => /\/test\//.test(f)

// test runner
const run = (f) => {
  const exp = require(f)
  for (const prop in exp) {
    const test = exp[prop]
    test((label, func) => {
      const filename = path.basename(f, '.test.js')
      let display = `${prop}`
      if (label !== prop) { display = `${prop}: ${label}` }
      return tape(`${filename}: ${display}`, func)
    }, common)
  }
}

// run unit tests
if (suite.includes('unit')) { files.filter(unit).forEach(run) }
