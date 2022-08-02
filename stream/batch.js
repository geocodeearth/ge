const _ = require('lodash')
const parallel = require('through2-parallel')
const baseFields = require('./csv_fields')
const statusFields = ['ge:status', 'ge:errors']
const client = require('../src/client')

// Perform geocoding requests, map response JSON to CSV
const streamFactory = (options) => {
  const http = client()
  const streamOptions = _.pick(options, 'concurrency')
  const extraFields = _.get(options, 'fields')

  // merge base fields with any user-specified fields
  const fields = _.assign({}, baseFields, extraFields)

  // optionally repaint metrics after each log line
  function log () {
    process.stderr.clearScreenDown()
    console.error.apply(null, arguments)
    if (options.summary && options.tick) { options.metrics.overprint() }
  }

  // auto-discover plan limits and raise concurrency accordingly
  const discovery = _.once((res, stream) => {
    const qps = _.toNumber(_.get(res.headers, 'x-ratelimit-limit-second'))
    if (_.isNumber(qps)) {
      if (options.verbose) { log(`discovered QPS: ${qps}`) }
      if (qps > stream.concurrency) {
        if (options.verbose) { log(`updating concurrency: ${qps}`) }
        stream.concurrency = qps
      }
    }
  })

  const stream = parallel.obj(streamOptions, (row, enc, next) => {
    options.metrics.inc('seen', 1)

    // ensure every row contains all columns (even if they are empty)
    _.defaults(row, _.zipObject(statusFields.concat(_.keys(fields))))

    // skip any rows which already contain the cell 'ge:status=200'
    // unless the 'force' option is enabled, which overrides this.
    if (!options.force && _.get(row, 'ge:status') === '200') {
      options.metrics.inc('skipped', 1)
      return next(null, row)
    }

    // reset fields which store the HTTP status and any API errors
    _.set(row, 'ge:status', '200')
    _.set(row, 'ge:errors', '')

    // the http request options (params, headers, etc)
    const req = { params: {} }

    // call each template function to populate request object
    _.each(options.templates, (fn) => fn(req, row))

    // skip rows which produce no query params
    // https://github.com/axios/axios#request-config
    if (_.isEmpty(req.params)) {
      options.metrics.inc('invalid', 1)
      log('skipping request, no parameters')
      return next(null, row)
    }

    // verbose logging
    if (options.verbose) { log(options.endpoint, req) }

    // send http request
    http
      .get(options.endpoint, req)
      .then(res => {
        // auto-discover plan limits and raise concurrency accordingly
        if (options.discovery) { discovery(res, stream) }

        // use the first feature returned
        const feature = _.get(res, 'data.features[0]')
        if (!feature) {
          options.metrics.inc('notfound', 1)
          return
        }

        // copy target fields to CSV row
        options.metrics.inc('success', 1)
        _.each(fields, (jpath, column) => { row[column] = _.get(feature, jpath) })
      })
      .catch(error => {
        options.metrics.inc('failure', 1)

        // record HTTP status and any API errors
        _.set(row, 'ge:status', _.get(error, 'response.status', '???'))
        _.set(row, 'ge:errors', _.get(error, 'response.data.geocoding.errors', []).join(' | '))

        // print errors to stderr in verbose mode
        if (options.verbose) {
          log(_.get(row, 'ge:status'), _.get(row, 'ge:errors'), _.get(error, 'message'))
        }
      })
      .finally(() => {
        // add a delay to avoid '429 Too Many Requests' rate-limit errors
        _.delay(next, 1000, null, row)
      })
  })

  return stream
}

module.exports.geocoder = streamFactory
