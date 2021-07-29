const _ = require('lodash')
const http = require('http')
const https = require('https')
const axios = require('axios')
const profile = require('./profile')

// Create an HTTP client with defaults
// https://github.com/axios/axios#request-config
module.exports = (options) => axios.create(_.defaults(options, {
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
  baseURL: 'https://api.geocode.earth',
  params: { api_key: profile().api_key.toString() }
}))
