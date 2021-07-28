const _ = require('lodash')
const fs = require('fs')
const stream = {
  csv: require('../../../stream/csv'),
  batch: require('../../../stream/batch')
}

module.exports = {
  command: 'csv <file>',
  describe: 'append geocoded columns to a CSV file',
  builder: (yargs) => {
    // mandatory params
    yargs.positional('file', {
      type: 'string',
      describe: 'location of the input CSV file.'
    })

    // optional params
    yargs.option('param', {
      alias: 'p',
      type: 'string',
      describe: 'Define a parameter.'
    })
    yargs.option('template', {
      alias: 't',
      type: 'string',
      describe: 'Define a template.'
    })
    yargs.option('endpoint', {
      type: 'string',
      default: '/v1/search',
      describe: 'API endpoint to query.'
    })
    yargs.option('concurrency', {
      type: 'number',
      default: 5,
      describe: 'Maximim queries per-second.'
    })
  },
  handler: (argv) => {
    const mappings = _.zipObject(_.castArray(argv.param), _.castArray(argv.template))
    const templates = _.map(mappings, (template, param) => {
      const render = _.template(template)
      return (req, row) => {
        if (!_.isPlainObject(req.params)) { req.params = {} }
        req.params[param] = render({ row })
      }
    })

    fs.createReadStream(argv.file)
      .pipe(stream.csv.parser())
      .pipe(stream.batch.geocoder({
        templates,
        endpoint: argv.endpoint,
        concurrency: argv.concurrency,
        verbose: argv.verbose
      }))
      .pipe(stream.csv.stringifier())
      .pipe(process.stdout)
  }
}
