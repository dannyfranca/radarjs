import { Radar } from '../src'
import { subcribeToPromiseFactory } from '../src/helpers'

const radar = new Radar()
const toPromise = subcribeToPromiseFactory(radar)

test('Trigger micromatch', async () => {
  const promise = Promise.all([
    expect(toPromise('event', val => val)).rejects.toEqual('timeout'),
    expect(toPromise('event:child', val => val)).rejects.toEqual('timeout'),
    expect(toPromise('event:foo', val => val)).resolves.toEqual('info'),
    expect(toPromise('event:fooo', val => val)).resolves.toEqual('info'),
    expect(toPromise('event:bar', val => val)).resolves.toEqual('info'),
    expect(toPromise('event-baz', val => val)).resolves.toEqual('info'),
  ])

  radar.trigger('event*ba*', 'info')
  radar.trigger('event:f*', 'info')

  return promise
})
