const _ = require('lodash')

// JSON feature properties to extract from the JSON response
// on the left are the names of the CSV columns, on the right
// are the correspoding JSON path to extract.
const fields = {
  // identity fields
  'ge:gid': 'properties.gid',
  'ge:layer': 'properties.layer',
  'ge:source': 'properties.source',
  'ge:source_id': 'properties.source_id',
  'ge:country_code': 'properties.country_code',

  // name fields
  'ge:name': 'properties.name',
  'ge:label': 'properties.label',

  // confidence fields
  'ge:confidence': 'properties.confidence',
  'ge:match_type': 'properties.match_type',
  'ge:accuracy': 'properties.accuracy',

  // address fields
  'ge:address:unit': 'properties.unit',
  'ge:address:housenumber': 'properties.housenumber',
  'ge:address:street': 'properties.street',
  'ge:address:postalcode': 'properties.postalcode',

  // geographic fields
  'ge:geo:lon': 'geometry.coordinates[0]',
  'ge:geo:lat': 'geometry.coordinates[1]',
  'ge:geo:bbox': 'bbox'
}

// administrative hierarchy fields
_.forEach([
  'continent', 'ocean', 'empire',
  'country', 'dependency', 'marinearea',
  'macroregion', 'region', 'macrocounty',
  'county', 'locality', 'borough',
  'localadmin', 'neighbourhood', 'postalcode'
], (placetype) => {
  fields[`ge:admin:${placetype}`] = `properties.${placetype}`
  fields[`ge:admin:${placetype}_gid`] = `properties.${placetype}_gid`
  fields[`ge:admin:${placetype}_a`] = `properties.${placetype}_a`
})

module.exports = fields
