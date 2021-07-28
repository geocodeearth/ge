const _ = require('lodash')
const parallel = require('through2-parallel').obj
const fields = require('./csv_fields')
const client = require('../src/client')()

// Perform geocoding requests, map response JSON to CSV
const streamFactory = (options) => {
  options = _.defaults(options, {
    verbose: false,
    endpoint: '/v1/search',
    concurrency: 5,
    templates: []
  })

  return parallel({ concurrency: options.concurrency }, (row, enc, next) => {
    // https://geocode.earth/docs/forward/search/
    // https://geocode.earth/docs/forward/customization/
    const reqOptions = {}

    _.each(options.templates, (fn) => {
      fn(reqOptions, row)
    })

    if (_.isEmpty(reqOptions)) {
      console.error('skipping request, no parameters')
      process.exit(1)
    }

    if (options.verbose) {
      console.error(options.endpoint, reqOptions)
    }

    client.get(options.endpoint, reqOptions).then(res => {
      // ensure every row contains all columns (even if they are empty)
      _.assign(row, _.zipObject(_.keys(fields)))

      // use the first feature
      const feature = _.get(res, 'data.features[0]')
      if (feature) {
        // append target fields to CSV row
        _.each(fields, (jpath, column) => {
          row[column] = _.get(feature, jpath)

          // JSON encode non-scalar properties
          // if (!_.isEmpty(row[column]) || _.isString(row[column]) || _.isNumber(row[column])) {
          //   row[column] = JSON.stringify(row[column])
          // }
        })
      }

      // add a delay to avoid '429 Too Many Requests' rate-limit errors
      _.delay(next, 1000, null, row)
    })
      .catch(error => {
      // display the HTTP response where available
        if (_.has(error, 'response.data')) {
          console.error(error.response.data)
          process.exit(1)
        }
        // else the verbose error
        next(error)
      })
  })
}

module.exports.geocoder = streamFactory
