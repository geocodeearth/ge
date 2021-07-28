#!/usr/bin/env node

require('yargs')
  .scriptName('ge')
  .usage('$0 <cmd> [args]')
  .middleware(require('./middleware'))
  // .completion('completion')
  .option('verbose', {
    type: 'boolean',
    default: false,
    alias: 'v',
    describe: 'enable verbose logging'
  })
  .commandDir('cmd')
  .strict()
  .showHelpOnFail(true)
  .demandCommand(1, '')
  .help()
  .parse()
