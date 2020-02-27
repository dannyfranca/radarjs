import { Radar } from '../src'

const radar = new Radar()

test('Setting new error handler', () => {
  expect(() =>
    radar.errorHandler = error => {
      console.log(error.message)
    }
  ).not.toThrow()
  expect(() => radar.onSync('', () => 'will not throw')).not.toThrow()
  expect(() => radar.offSync('')).not.toThrow()
  expect(() => {
    radar.linkSync('parent', 'child')
    radar.linkSync('child', 'parent')
  }).not.toThrow()
})
