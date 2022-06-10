const _ = require('lodash')
const colors = require('colors/safe')

class Metrics {
  constructor () {
    this.metric = {}
  }

  inc (metric, delta) {
    this.metric[metric] = (this.metric[metric] || 0) + delta
  }

  overprint () {
    process.stderr.clearLine()
    this.print('progress')
    process.stderr.cursorTo(0) // move left
    process.stderr.moveCursor(0, -11) // move up
    process.stderr.clearLine()
  }

  print (style) {
    let palette = { fg: colors.blue, bg: colors.bgBlue }
    if (style === 'error') { palette = { fg: colors.red, bg: colors.bgRed } }
    if (style === 'success') { palette = { fg: colors.green, bg: colors.bgGreen } }

    process.stderr.clearScreenDown()
    console.error()
    console.error(palette.fg(_.repeat('▄', 70)))
    console.error(palette.bg.bold(_.padEnd(' batch summary', 70)))
    console.error(palette.fg(_.repeat('▀', 70)))
    _.forEach({
      seen: colors.reset.gray.italic('total CSV rows processed'),
      success: colors.reset.gray.italic('successful API requests sent'),
      notfound: colors.reset.gray.italic('API requests which returned 0 features'),
      failure: colors.reset.gray.italic('API requests which produced an error'),
      skipped: colors.reset.gray.italic('skipped rows (previously geocoded)'),
      invalid: colors.reset.gray.italic('CSV rows which produced 0 query params')
    }, (tip, metric) => {
      console.error(
        colors[(this.metric[metric] ? 'bold' : 'dim')](
          '',
          colors.yellow(_.padEnd(metric, 12)),
          colors.cyan(_.padStart(this.metric[metric], 8)),
          _.repeat(' ', 7), tip,
          ''
        )
      )
    })
    console.error()
  }
}

module.exports = Metrics
