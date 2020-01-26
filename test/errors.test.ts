import { Radar } from '../src/radar'

const eventus = new Radar()

test('Subscription errors', () => {
  expect(() => eventus.on('', () => 'will throw')).toThrow()
  expect(() => eventus.on('.', () => 'will throw')).toThrow()
  expect(() => eventus.on('.namespace', () => 'will throw')).toThrow()
})

test('Unsubscription errors', () => {
  expect(() => eventus.off('')).toThrow()
  expect(() => eventus.off('.')).toThrow()
  expect(() => eventus.off('event.namespace')).toThrow()
})
