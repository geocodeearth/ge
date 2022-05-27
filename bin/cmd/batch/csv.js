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
    yargs.option('column', {
      alias: 'c',
      type: 'string',
      describe: 'Define a new column.'
    })
    yargs.option('selector', {
      alias: 's',
      type: 'string',
      describe: 'Define _.get() selector path.'
    })
    yargs.option('endpoint', {
      type: 'string',
      default: '/v1/search',
      describe: 'API endpoint to query.'
    })
    yargs.option('concurrency', {
      type: 'number',
      default: 5,
      describe: 'Maximum queries per-second.'
    })
    yargs.option('discovery', {
      type: 'boolean',
      default: true,
      describe: 'Maximum concurrency will be applied based on your plan limits.'
    })
    yargs.option('force', {
      alias: 'f',
      type: 'boolean',
      default: false,
      describe: 'Force previously geocoded rows to be refreshed.'
    })
  },
  handler: (argv) => {
    fs.createReadStream(argv.file)
      .pipe(stream.csv.parser())
      .pipe(stream.batch.geocoder({
        templates: generateTemplates(argv),
        fields: generateFields(argv),
        endpoint: argv.endpoint,
        concurrency: argv.concurrency,
        discovery: argv.discovery,
        verbose: argv.verbose,
        force: argv.force
      }))
      .pipe(stream.csv.stringifier())
      .pipe(process.stdout)
  }
}

function generateTemplates (argv) {
  // report error if user failed to specify any valid pairs
  if (_.isEmpty(argv.param) || _.isEmpty(argv.template)) {
    throw new Error('error: you must specify at least one pair of -p (param) and -t (template) flags.')
  }

  // cast scalar (single flag specified) values to arrays
  const p = _.castArray(argv.param)
  const t = _.castArray(argv.template)

  // report error if pairs are unbalanced
  if (_.size(p) !== _.size(t)) {
    throw new Error('error: you pair every -p (param) flag with a -t (template) flag.')
  }

  const mappings = _.zipObject(p, t)
  if (argv.verbose) { console.error('param templates', mappings) }

  const templates = _.map(mappings, (template, param) => {
    // compile template
    const render = _.template(template)

    // return req param template function
    return (req, row) => { req.params[param] = render({ row }) }
  })

  return templates
}

function generateFields (argv) {
  // cast scalar (single flag specified) values to arrays
  const c = _.filter(_.castArray(argv.column), _.size)
  const s = _.filter(_.castArray(argv.selector), _.size)

  // report error if pairs are unbalanced
  if (_.size(c) !== _.size(s)) {
    throw new Error('error: you pair every -c (column) flag with a -s (selector) flag.')
  }

  return _.zipObject(c, s)
}
