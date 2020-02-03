import { Radar } from '../src/radar'

const radar = new Radar()

test('Subscription errors', () => {
  expect(radar.on('', () => 'will throw')).rejects.toBeInstanceOf(Error)
  expect(() => radar.onSync(':', () => 'will throw')).not.toThrow()
  expect(() => radar.onSync('.', () => 'will throw')).toThrow()
  expect(() => radar.onSync('.namespace', () => 'will throw')).toThrow()
})

test('Unsubscription errors', () => {
  expect(() => radar.offSync('')).toThrow()
  expect(() => radar.offSync('.')).toThrow()
  expect(() => radar.offSync('event.namespace')).toThrow()
})

test('Link errors', () => {
  expect(() => {
    radar.link('parent', 'child')
    radar.link('child', 'parent')
  }).toThrow()
  // expect(() => radar.linkTree('foo.bar.baz.foo')).toThrow()
})

test('To promise error', () => {
  expect(Radar.toPromise(() => {
    throw new Error()
  })).rejects.toBeInstanceOf(Error)
})
