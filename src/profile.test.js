const profile = require('./profile')

module.exports.interface = (test) => {
  test('generate', (t) => {
    t.true(typeof profile === 'function')
    t.equals(profile.length, 0)
    t.end()
  })
}
