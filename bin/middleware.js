const _ = require('lodash')
const PrettyError = require('pretty-error')
const updateNotifier = require('update-notifier')
const pkg = require('../package.json')

/**
 * The uncaughtExceptionMiddleware registers a global
 * 'uncaughtException' handler which catches any otherwise
 * uncaught errors.
 */
const uncaughtExceptionMiddleware = (argv) => {
  // Register the global error handler
  process.on('uncaughtException', (err) => {
    // Gracefully swallow EPIPE and SIGPIPE signals such
    // as when STDOUT is piped to a process which exits
    // prematurely. ie 'wof ... | head'.
    if (err && (err.code === 'EPIPE' || err.code === 'SIGPIPE')) {
      process.exitCode = 0
      return
    }

    // Print a pretty error message
    console.error(new PrettyError().render(err))
    process.exit(1)
  })
}

/**
 * The updateNotifierMiddleware prompts the user to upgrade
 * the package when a newer version is available.
 *
 * see: https://github.com/yeoman/update-notifier
 */
const updateNotifierMiddleware = (argv) => {
  // skip update notifier unless running a version published to npm
  if (_.get(pkg, 'version', '0.0.0-development') === '0.0.0-development') { return }

  updateNotifier({ pkg }).notify()
}

module.exports = [
  uncaughtExceptionMiddleware,
  updateNotifierMiddleware
]
