import { Radar } from '../src/radar'

const radar = new Radar()

test('Setting new error handler', () => {
  expect(() =>
    radar.setErrorHandler(error => {
      console.log(error.message)
    })
  ).not.toThrow()
  expect(() => radar.on('', () => 'will not throw')).not.toThrow()
})
