const parse = require('csv-parse')
const stringify = require('csv-stringify')

const defaults = {
  parse: {
    trim: true,
    skip_empty_lines: true,
    relax_column_count: true,
    relax: true,
    columns: true
  },
  stringify: {
    header: true
  }
}

module.exports = {
  parser: (options) => parse(options || defaults.parse),
  stringifier: (options) => stringify(options || defaults.stringify)
}
