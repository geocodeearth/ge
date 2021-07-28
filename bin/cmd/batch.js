module.exports = {
  command: 'batch',
  describe: 'batch geocoding tools',
  builder: (yargs) => yargs
    .commandDir('batch')
    .usage('$0 <cmd> [args]')
    .demandCommand(1, '')
}
