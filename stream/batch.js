const _ = require('lodash')
const parallel = require('through2-parallel')
const baseFields = require('./csv_fields')
const client = require('../src/client')

// Perform geocoding requests, map response JSON to CSV
const streamFactory = (options) => {
  const http = client()
  const streamOptions = _.pick(options, 'concurrency')
  const extraFields = _.get(options, 'fields')

  // merge base fields with any user-specified fields
  const fields = _.assign({}, baseFields, extraFields)

  // auto-discover plan limits and raise concurrency accordingly
  const discovery = _.once((res, stream) => {
    const qps = _.toNumber(_.get(res.headers, 'x-ratelimit-limit-second'))
    if (_.isNumber(qps)) {
      if (options.verbose) { console.error(`discovered QPS: ${qps}`) }
      if (qps > stream.concurrency) {
        if (options.verbose) { console.error(`updating concurrency: ${qps}`) }
        stream.concurrency = qps
      }
    }
  })

  const stream = parallel.obj(streamOptions, (row, enc, next) => {
    stream.stats.seen++

    // skip any rows which already contain the cell 'ge:status=200'
    // unless the 'force' option is enabled, which overrides this.
    if (!options.force && _.get(row, 'ge:status') === '200') {
      stream.stats.skipped++
      return next(null, row)
    }

    // add fields to store the HTTP status and any API errors
    _.set(row, 'ge:status', '200')
    _.set(row, 'ge:errors', '')

    // ensure every row contains all columns (even if they are empty)
    _.defaults(row, _.zipObject(_.keys(fields)))

    // the http request options (params, headers, etc)
    const req = { params: {} }

    // call each template function to populate request object
    _.each(options.templates, (fn) => fn(req, row))

    // skip rows which produces no query params
    // https://github.com/axios/axios#request-config
    if (_.isEmpty(req.params)) {
      console.error('skipping request, no parameters')
      return next(null, row)
    }

    // verbose logging
    if (options.verbose) { console.error(options.endpoint, req) }

    // send http request
    http
      .get(options.endpoint, req)
      .then(res => {
        stream.stats.success++

        // auto-discover plan limits and raise concurrency accordingly
        if (options.discovery) { discovery(res, stream) }

        // use the first feature returned
        const feature = _.get(res, 'data.features[0]')
        if (feature) {
          // copy target fields to CSV row
          _.each(fields, (jpath, column) => { row[column] = _.get(feature, jpath) })
        }
      })
      .catch(error => {
        stream.stats.failure++

        // record HTTP status and any API errors
        _.set(row, 'ge:status', _.get(error, 'response.status', '???'))
        _.set(row, 'ge:errors', _.get(error, 'response.data.geocoding.errors', []).join(' | '))

        // print errors to stderr in verbose mode
        if (options.verbose) {
          console.error(_.get(row, 'ge:status'), _.get(row, 'ge:errors'))
        }
      })
      .finally(() => {
        // add a delay to avoid '429 Too Many Requests' rate-limit errors
        _.delay(next, 1000, null, row)
      })
  })

  // record summary statistics
  stream.stats = { seen: 0, skipped: 0, success: 0, failure: 0 }

  return stream
}

module.exports.geocoder = streamFactory
