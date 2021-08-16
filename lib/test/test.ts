import * as lib from '../src'

test('tests can pass', () => {
  expect(true).toBe(true)
})

test('getConfig returns a config object', () => {
  const config = lib.getConfig('test/test-config.json')
  console.log(config)
  expect(config.testConfigKey).toBe('testConfigValue')
})
