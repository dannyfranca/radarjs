import { Radar } from '../src'
import { subcribeToPromiseFactory } from '../src/helpers'

const radar = new Radar()
const toPromise = subcribeToPromiseFactory(radar)

test('Simple Event Flow', async () => {
  const promise = Promise.all([
    expect(toPromise('event', val => val)).resolves.toEqual('info'),
    expect(toPromise('event.ns1', val => val)).rejects.toEqual('timeout'),
    expect(toPromise('event2.ns1', val => val)).rejects.toEqual('timeout'),
    expect(toPromise('event3.ns2', val => val)).resolves.toEqual('info3'),
    expect(toPromise('event3.ns2.ns1', val => val)).rejects.toEqual('timeout'),
    expect(toPromise('event4.ns2', val => val)).rejects.toEqual('timeout')
  ])

  radar.off('.ns1')
  radar.offSync('.ns3')
  radar.trigger('event', 'info')
  radar.trigger('event2', 'info2')
  radar.triggerSync('event3', 'info3')
  radar.off('event4')
  radar.trigger('event4', 'info4')
  radar.off('event4')

  return promise
})
