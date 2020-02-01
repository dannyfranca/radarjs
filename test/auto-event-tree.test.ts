import { Radar } from '../src/radar'
import { subcribeToPromiseFactory } from '../src/helpers'

const radar = new Radar()
const toPromise = subcribeToPromiseFactory(radar)

test('Autolink Events', async () => {
  const promise = Promise.all([
    expect(toPromise('event1:frag1:frag2', val => val)).resolves.toEqual('info'),
    expect(toPromise('event1:frag1', val => val)).resolves.toEqual('info'),
    expect(toPromise('event1', val => val)).resolves.toEqual('info'),
    expect(toPromise('event2:frag1:frag2', val => val)).rejects.toEqual('timeout'),
    expect(toPromise('event2:frag1', val => val)).resolves.toEqual('info2'),
    expect(toPromise('event2', val => val)).resolves.toEqual('info2'),
    expect(toPromise('event3', val => val)).resolves.toEqual('info3'),
    expect(toPromise('event3:frag1', val => val)).resolves.toEqual('info3'),
    expect(toPromise('event3:frag1:frag2', val => val)).resolves.toEqual('info3'),
    expect(toPromise('event4', val => val)).rejects.toEqual('timeout'),
    expect(toPromise('event4:frag1', val => val)).rejects.toEqual('timeout'),
    expect(toPromise('event4:frag1:frag2', val => val)).resolves.toEqual('info4'),
  ])

  radar.emit('event1:frag1:frag2', 'info')
  radar.emit('event2:frag1', 'info2')
  radar.broadcast('event3', 'info3')
  radar.off('event4')
  radar.off('event4:frag1')
  radar.broadcast('event4', 'info4')

  return promise
})
