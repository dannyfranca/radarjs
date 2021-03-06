import { Radar } from '../src'

test('Empty Event String', () => {
  const eventObject1 = Radar.formatEventString('')
  const eventObject2 = Radar.formatEventString('.')
  expect(eventObject1.eventName).toBe('')
  expect(eventObject1.tags.length).toBe(0)
  expect(eventObject2.eventName).toBe('')
  expect(eventObject2.tags.length).toBe(0)
})

test('Only Event Name', () => {
  const eventObject = Radar.formatEventString('event')
  expect(eventObject.eventName).toBe('event')
  expect(eventObject.tags.length).toBe(0)
})

test('Only Namespace', () => {
  const eventObject1 = Radar.formatEventString('.namespace')
  const eventObject2 = Radar.formatEventString('.name.space')
  expect(eventObject1.eventName).toBe('')
  expect(eventObject1.tags.length).toBe(1)
  expect(eventObject2.eventName).toBe('')
  expect(eventObject2.tags.length).toBe(2)
})

test('Event Name and Namespaces', () => {
  const eventObject1 = Radar.formatEventString('event.namespace')
  const eventObject2 = Radar.formatEventString('event.name.space')
  expect(eventObject1.eventName).toBe('event')
  expect(eventObject1.tags.length).toBe(1)
  expect(eventObject2.eventName).toBe('event')
  expect(eventObject2.tags.length).toBe(2)
})

test('Event Tree Names', () => {
  expect(Radar.generateAutoEventTreeNames('event:frag1:frag2')).toStrictEqual(['event', 'event:frag1', 'event:frag1:frag2'])
})
