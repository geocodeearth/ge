const _ = require('lodash')
const ENV_VAR = 'GE_API_KEY'
const PATTERN = /^ge-[0-9a-f]{16}$/

class ApiKey {
  constructor (value) {
    ApiKey.validate(value)
    this.key = value
  }

  toString () {
    return this.key
  }

  static validate (value) {
    if (!_.isString(value) || !PATTERN.test(value)) {
      throw new Error(`invalid api_key, you must set the environment variable: ${ENV_VAR}`)
    }
  }

  static fromEnvironment () {
    return new ApiKey(_.get(process.env, ENV_VAR))
  }
}

module.exports = ApiKey
