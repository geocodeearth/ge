const ApiKey = require('./ApiKey')

function generate () {
  return {
    api_key: ApiKey.fromEnvironment()
  }
}

module.exports = generate
