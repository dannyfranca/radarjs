import { Radar } from '../src/radar'

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
    radar.link('parent', 'child')
    radar.link('child', 'parent')
  }).not.toThrow()
})
