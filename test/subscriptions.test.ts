import { Radar } from '../src/radar'
import { subcribeToPromiseFactory } from '../src/helpers'

const radar = new Radar()
const toPromise = subcribeToPromiseFactory(radar)

test('Subscription and trigger', async () => {
  const promise = Promise.all([
    expect(toPromise('event', val => val)).resolves.toEqual('info'),
    expect(toPromise('event.ns1', val => val)).rejects.toEqual('timeout'),
    expect(toPromise('event2.ns1', val => val)).rejects.toEqual('timeout'),
    expect(toPromise('event3.ns2', val => val)).resolves.toEqual('info3'),
    expect(toPromise('event3.ns2.ns1', val => val)).rejects.toEqual('timeout'),
    expect(toPromise('event4.ns2', val => val)).rejects.toEqual('timeout')
  ])

  radar.off('.ns1')
  radar.off('.ns3')
  radar.trigger('event', 'info')
  radar.asyncTrigger('event2', 'info2')
  radar.trigger('event3', 'info3')
  radar.unsubscribe('event4')
  radar.next('event4', 'info4')
  radar.unsubscribe('event4')

  return promise
})
