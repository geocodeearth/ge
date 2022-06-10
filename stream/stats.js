const _ = require('lodash')
const through = require('through2')

function factory (metrics, interval) {
  // no-op stream
  const stream = through.obj()

  // print stats on an interval
  if (_.isNumber(interval) && interval > 0) {
    const cancel = setInterval(() => { metrics.overprint() }, interval)
    stream.on('end', () => { clearInterval(cancel) })
  }

  // print the final stats
  stream.on('end', () => { metrics.print('success') })

  return stream
}

module.exports = factory
