import { Radar } from '../src/radar'

const eventus = new Radar()

test('Setting new error handler', () => {
  expect(() =>
    eventus.setErrorhandler(error => {
      console.log(error.message)
    })
  ).not.toThrow()
  expect(() => eventus.on('', () => 'will not throw')).not.toThrow()
})
