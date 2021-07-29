const ApiKey = require('./ApiKey')

module.exports.interface = (test) => {
  test('interface', (t) => {
    t.true(typeof ApiKey === 'function')
    t.end()
  })
}

module.exports.validate = (test) => {
  test('validate - garbage', (t) => {
    t.throws(() => ApiKey.validate(), /invalid api_key/)
    t.throws(() => ApiKey.validate(''), /invalid api_key/)
    t.throws(() => ApiKey.validate(0), /invalid api_key/)
    t.throws(() => ApiKey.validate(0.0), /invalid api_key/)
    t.throws(() => ApiKey.validate(1), /invalid api_key/)
    t.throws(() => ApiKey.validate(1.1), /invalid api_key/)
    t.throws(() => ApiKey.validate(null), /invalid api_key/)
    t.throws(() => ApiKey.validate(undefined), /invalid api_key/)
    t.throws(() => ApiKey.validate({}), /invalid api_key/)
    t.throws(() => ApiKey.validate([]), /invalid api_key/)
    t.end()
  })
  test('validate - pattern invalid', (t) => {
    t.throws(() => ApiKey.validate(''), /invalid api_key/)
    t.throws(() => ApiKey.validate('ge-foo'), /invalid api_key/)
    t.throws(() => ApiKey.validate(' ge-1111111111111111'), /invalid api_key/)
    t.throws(() => ApiKey.validate('ge-1111111111111111 '), /invalid api_key/)
    t.throws(() => ApiKey.validate('ge-AAAAAAAAAAAAAAAA'), /invalid api_key/)
    t.end()
  })
  test('validate - pattern valid', (t) => {
    t.doesNotThrow(() => ApiKey.validate('ge-1111111111111111'))
    t.doesNotThrow(() => ApiKey.validate('ge-aaaaaaaaaaaaaaaa'))
    t.end()
  })
}

module.exports.constructor = (test) => {
  test('constructor', (t) => {
    t.equal('ge-1111111111111111', new ApiKey('ge-1111111111111111').key)
    t.equal('ge-aaaaaaaaaaaaaaaa', new ApiKey('ge-aaaaaaaaaaaaaaaa').key)
    t.end()
  })
}

module.exports.toString = (test) => {
  test('toString', (t) => {
    t.equal('ge-1111111111111111', new ApiKey('ge-1111111111111111').toString())
    t.equal('ge-aaaaaaaaaaaaaaaa', new ApiKey('ge-aaaaaaaaaaaaaaaa').toString())
    t.end()
  })
}
