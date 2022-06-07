const _ = require('lodash')
const fs = require('fs')
const colors = require('colors/safe')
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
    yargs.option('summary', {
      type: 'boolean',
      default: true,
      describe: 'Print summary statistics.'
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
      }).on('end', function () {
        // print summary statistics
        if (argv.summary) { summary(this.stats) }
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

// print summary statistics
function summary (stats) {
  console.error(colors.blue(_.repeat('▄', 70)))
  console.error(colors.bgBlue.bold(_.padEnd(' batch summary', 70)))
  console.error(colors.blue(_.repeat('▀', 70)))
  _.forEach({
    seen: colors.reset.gray.italic('total CSV rows processed'),
    success: colors.reset.gray.italic('successful API requests sent'),
    notfound: colors.reset.gray.italic('API request which returned 0 features'),
    failure: colors.reset.gray.italic('API requests which produced an error'),
    skipped: colors.reset.gray.italic('skipped rows (previously geocoded)'),
    invalid: colors.reset.gray.italic('CSV rows which produced 0 query params')
  }, (tip, label) => {
    console.error(
      colors[(stats[label] ? 'bold' : 'dim')](
        '',
        colors.yellow(_.padEnd(label, 12)),
        colors.cyan(_.padStart(stats[label], 8)),
        _.repeat(' ', 7), tip,
        ''
      )
    )
  })
  console.error()
}
