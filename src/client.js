const _ = require('lodash')
const http = require('http')
const https = require('https')
const axios = require('axios')
const profile = require('./profile')
const pkg = require('../package.json')

// Create an HTTP client with defaults
// https://github.com/axios/axios#request-config
module.exports = (options) => axios.create(_.defaults(options, {
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
  baseURL: 'https://api.geocode.earth',
  params: {
    client: _.compact(['ge', 'cli', _.get(pkg, 'version')]).join('-'),
    api_key: profile().api_key.toString()
  }
}))
