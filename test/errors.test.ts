import { Radar } from '../src/radar'

const radar = new Radar()

test('Subscription errors', () => {
  expect(() => radar.on('', () => 'will throw')).toThrow()
  expect(() => radar.on('.', () => 'will throw')).toThrow()
  expect(() => radar.on('.namespace', () => 'will throw')).toThrow()
})

test('Unsubscription errors', () => {
  expect(() => radar.off('')).toThrow()
  expect(() => radar.off('.')).toThrow()
  expect(() => radar.off('event.namespace')).toThrow()
})
