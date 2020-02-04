import { Radar } from '../src/radar'
import { subcribeToPromiseFactory } from '../src/helpers'

const radar = new Radar()
const toPromise = subcribeToPromiseFactory(radar)

test('Trigger Many', async () => {
  const promise = Promise.all([
    expect(toPromise('trigger', val => val)).resolves.toEqual('info'),
    expect(toPromise('trigger2', val => val)).resolves.toEqual('info'),
    expect(toPromise('trigger3', val => val)).resolves.toEqual('info'),
  ])

  radar.trigger('trigger.trigger2.trigger3', 'info')

  return promise
})

test('Emit Many', async () => {
  radar.linkTree('emit.emit-child1.emit-child4')
  radar.linkTree('emit.emit-child2.emit-child5')
  radar.linkTree('emit2.emit-child3.emit-child6')
  radar.linkTree('emit2.emit-child3.emit-child7')
  radar.link('emit2', 'emit-child8')

  const promise = Promise.all([
    expect(toPromise('emit', val => val)).resolves.toEqual('info'),
    expect(toPromise('emit2', val => val)).resolves.toEqual('info'),
    expect(toPromise('emit-child1', val => val)).resolves.toEqual('info'),
    expect(toPromise('emit-child2', val => val)).resolves.toEqual('info'),
    expect(toPromise('emit-child3', val => val)).resolves.toEqual('info'),
    expect(toPromise('emit-child4', val => val)).resolves.toEqual('info'),
    expect(toPromise('emit-child5', val => val)).resolves.toEqual('info'),
    expect(toPromise('emit-child6', val => val)).resolves.toEqual('info'),
    expect(toPromise('emit-child7', val => val)).rejects.toEqual('timeout'),
    expect(toPromise('emit-child8', val => val)).rejects.toEqual('timeout'),
  ])

  radar.emit(['emit-child4', 'emit-child5', 'emit-child6'], 'info')

  return promise
})

test('Broadcast Many', async () => {
  radar.linkTree('broadcast1.broadcast-child1')
  radar.linkTree('broadcast2.broadcast-child2')
  radar.linkTree('broadcast2.broadcast-child3.broadcast-child4')
  radar.linkTree('broadcast2.broadcast-child3.broadcast-child5')
  radar.linkTree('broadcast3.broadcast-child6')

  const promise = Promise.all([
    expect(toPromise('broadcast1', val => val)).resolves.toEqual('info'),
    expect(toPromise('broadcast2', val => val)).resolves.toEqual('info'),
    expect(toPromise('broadcast-child1', val => val)).resolves.toEqual('info'),
    expect(toPromise('broadcast-child2', val => val)).resolves.toEqual('info'),
    expect(toPromise('broadcast-child3', val => val)).resolves.toEqual('info'),
    expect(toPromise('broadcast-child4', val => val)).resolves.toEqual('info'),
    expect(toPromise('broadcast-child5', val => val)).resolves.toEqual('info'),
    expect(toPromise('broadcast3', val => val)).rejects.toEqual('timeout'),
    expect(toPromise('broadcast-child6', val => val)).rejects.toEqual('timeout'),
  ])

  radar.broadcast('broadcast1.broadcast2', 'info')

  return promise
})
