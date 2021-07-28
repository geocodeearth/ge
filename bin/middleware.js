const PrettyError = require('pretty-error')

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

    // Set error code
    process.exitCode = 1

    // Print a pretty error message
    console.error(new PrettyError().render(err))

    // Allow the program to exit naturally..
  })
}

module.exports = [
  uncaughtExceptionMiddleware
]
