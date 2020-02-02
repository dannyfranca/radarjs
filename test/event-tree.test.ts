import { Radar } from '../src/radar'
import { subcribeToPromiseFactory } from '../src/helpers'

const radar = new Radar()
const toPromise = subcribeToPromiseFactory(radar)

test('Subscription and trigger event tree', async () => {
  radar.link('parent1', 'child1')
  radar.link('parent1', 'child2')
  radar.link('parent2', 'child3')
  radar.link('parent2', 'child4')
  radar.link('parent2', 'child5')
  radar.link('parent2', 'child6')
  radar.link('parent3', 'child7')
  radar.link('grandparent', 'parent1')
  radar.linkTree('foo.bar.baz')

  const promise = Promise.all([
    expect(toPromise('grandparent', val => val)).resolves.toEqual('info'),
    expect(toPromise('parent1', val => val)).resolves.toEqual('info'),
    expect(toPromise('parent2', val => val)).resolves.toEqual('info2'),
    expect(toPromise('parent3', val => val)).resolves.toEqual('info3'),
    expect(toPromise('child1', val => val)).resolves.toEqual('info'),
    expect(toPromise('child2', val => val)).rejects.toEqual('timeout'),
    expect(toPromise('child3', val => val)).resolves.toEqual('info2'),
    expect(toPromise('child4', val => val)).resolves.toEqual('info2'),
    expect(toPromise('child5', val => val)).rejects.toEqual('timeout'),
    expect(toPromise('child6', val => val)).rejects.toEqual('timeout'),
    expect(toPromise('foo', val => val)).resolves.toEqual('foobar'),
    expect(toPromise('bar', val => val)).resolves.toEqual('foobar'),
    expect(toPromise('baz', val => val)).resolves.toEqual('foobar'),
  ])

  radar.emit('child1', 'info')
  radar.off('child5')
  radar.unlink('parent2', 'child6')
  radar.asyncBroadcast('parent2', 'info2')
  radar.asyncEmit('child7', 'info3')
  radar.broadcast('foo', 'foobar')

  return promise
})
