const _ = require('lodash')

function generate () {
  const profile = {
    api_key: _.get(process.env, 'GE_API_KEY')
  }

  if (!_.isString(profile.api_key) || _.isEmpty(profile.api_key)) {
    console.error(`inavalid api_key: ${profile.api_key}`)
    console.error('you must set the environment variable: GE_API_KEY')
    process.exit(1)
  }

  return profile
}

module.exports = generate
