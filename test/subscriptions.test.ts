import { Radar } from '../src/radar'
import { subcribeToPromiseFactory } from '../src/helpers'

const eventus = new Radar()
const toPromise = subcribeToPromiseFactory(eventus)

test('Subscription and trigger', async () => {
  const promise = Promise.all([
    expect(toPromise('event', val => val)).resolves.toEqual('info'),
    expect(toPromise('event.ns1', val => val)).rejects.toEqual('timeout'),
    expect(toPromise('event2.ns1', val => val)).rejects.toEqual('timeout'),
    expect(toPromise('event3.ns2', val => val)).resolves.toEqual('info3'),
    expect(toPromise('event3.ns2.ns1', val => val)).rejects.toEqual('timeout'),
    expect(toPromise('event4.ns2', val => val)).rejects.toEqual('timeout')
  ])

  eventus.off('.ns1')
  eventus.trigger('event', 'info')
  eventus.trigger('event2', 'info2')
  eventus.trigger('event3', 'info3')
  eventus.unsubscribe('event4')
  eventus.next('event4', 'info4')
  eventus.unsubscribe('event4')
  eventus.off('.ns3')

  return promise
})
