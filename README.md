<h1 align="center">dannyfranca/radarjs</h1>
<p align="center">Modern and Robust Event Emitter, with tagging, emitting and broadcasting. Internally uses Promises and RxJS Subjects.</p>
<p align="center">

<a href="https://npmjs.com/package/@dannyfranca/radarjs" target="_blank">
    <img src="https://img.shields.io/npm/dt/@dannyfranca/radarjs.svg?style=flat-square&logo=npm" />
</a>

<a href="https://npmjs.com/package/@dannyfranca/radarjs" target="_blank">
    <img src="https://img.shields.io/npm/v/@dannyfranca/radarjs/latest.svg?style=flat-square&logo=npm" />
</a>

<a href="https://travis-ci.com/dannyfranca/radarjs" target="_blank">
    <img src="https://img.shields.io/travis/dannyfranca/radarjs?style=flat-square&logo=travis" />
</a>

<a href="https://codecov.io/gh/dannyfranca/radarjs" target="_blank">
    <img src="https://img.shields.io/codecov/c/github/dannyfranca/radarjs?style=flat-square&logo=codecov" />
</a>

<a href="https://david-dm.org/dannyfranca/radarjs" target="_blank">
    <img src="https://david-dm.org/dannyfranca/radarjs/status.svg?style=flat-square" />
</a>

<a href="https://www.codacy.com/manual/dannyfranca/radarjs" target="_blank">
    <img src="https://img.shields.io/codacy/grade/addca1007fb044c3a994c7e0ec504092?style=flat-square&logo=codacy" />
</a>

</p>

## Install

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/3d72c3f610ce42f4807566929c6a9660)](https://app.codacy.com/manual/dannyfranca/radarjs?utm_source=github.com&utm_medium=referral&utm_content=dannyfranca/radarjs&utm_campaign=Badge_Grade_Dashboard)

### Module

#### Download

```bash
npm i radarjs
```

#### Import

```js
import { Radar } from '@dannyfranca/radarjs'

const radar = new Radar()
```

### CDN

```html
<script src="unpkg.com/radarjs"></script>

<!-- Specific Version -->
<script src="unpkg.com/radarjs@0.3.0/lib/radar.umd.js"></script>
```

## Usage

### Listen for Events

```js
const state = {
  count: 0,
  lastNotificationType: ''
}

radar.on('notify', () => state.count++)

// receive any number off values as arguments
radar.on('notify', ({ type }, ...data) => {
  state.lastNotificationType = type
  console.log(data)
}

// can use namespaces
radar.on('notify.namespace1.namespace2', (...data) => {/*...*/})
```

### Unsubscribe from Events

```js
// by event name
radar.off('notify')

// by namespace
radar.off('.namespace1')

// by Subscription
const subscribeThenUnsubscribe = async () => {
  const subscription = await radar.on('event', (...data) => {/*...*/})
  subscription.unsubscribe()
}

subscribeThenUnsubscribe()

// by Subscription (sync)
const subscription = radar.onSync('event', (...data) => {/*...*/})
subscription.unsubscribe()
```

### Trigger Events

```js
// pass any data to an event trigger
radar.trigger('notify', {
  type: 'info',
  message: 'Just an ordinary notification'
})

// pass any number of data
radar.trigger('notify', notification, ...data)
```

### MultiLevel Events

```js
// set child event
radar.link('grandparent', 'parent')
radar.link('parent', 'child')

// destroy link
radar.unlink('parent', 'child')

// broadcast events down to the whole tree just like trigger
// will trigger grandparent, parent and child
radar.broadcast('grandparent', ...data)

// will trigger parent and child
radar.broadcast('parent', ...data)

// emit events up to the whole tree just like trigger
// will trigger child, parent and grandparent
radar.emit('child', ...data)

// will trigger only grandparent
radar.emit('grandparent', ...data)
```

### Sync Variants

Every public methods returns Promises, but each one has a sync variant, with same syntax.

```js
radar.on('event', ...data) // returns Promise<Subscription>
radar.onSync('event', ...data) // returns Subscription
radar.trigger('event', ...data) // returns Promise<void>
radar.triggerSync('event', ...data) // returns void
// and so on...
```

### MultiTriggering

To trigger/emit/broadcast many events with same data, you can use arrays of strings or a single string with event names separated by dots. Each event name is resolved by a glob pattern (powered by [micromatch](https://github.com/micromatch/micromatch))!

```js
// will trigger "foo" and "bar", sending same datas
radar.trigger('foo.bar', ...data)
// same as
radar.trigger(['foo', 'bar'], ...data)


// with micromatch
radar.on('foo', () => {/*...*/})
radar.on('bar', () => {/*...*/})
radar.on('baz', () => {/*...*/})
radar.on('boom', () => {/*...*/})

// will trigger "bar" and "baz"
radar.trigger('ba*', ...data) 
// will trigger "boom"
radar.trigger('b*m', ...data)

// many micromatches allowed!
// will trigger "bar", "baz" and  "boom"
radar.triggerMany('ba*.bo*', ...data)
radar.triggerMany(['ba*', 'bo*'], ...data)
```

See all glob possibilities in [micromatch](https://github.com/micromatch/micromatch)

#### Auto Link

You can autolink with ":" character

```js
radar.on('event:frag1:frag2', () => {/*...*/})

// will fire "event", "event:frag1" and "event:frag1:frag2" events
radar.broadcast('event', ...data)

// will fire "event:frag1" and "event" events
radar.emit('event:frag1', ...data)

// ATTENTION: will fire just frag1.
// frag1 and frag2 is not supposed to be events,
// just words appended to eventNames
radar.broadcast('frag1', ...data)
```

### Native Events

Native events has reserved names starting with $. Until now, the only native event available is $error.

#### $error event

```typescript
// listening to $error
radar.on('$error', (error: Error) => {/*...*/})
```

Radar default error handler is:

```typescript
(error: Error) => { throw error }
```

You can set yout own:

```typescript
// set your error handler
radar.setErrorHandler((error: Error) => {/*...*/})
```

## License

[MIT](./LICENSE)

Copyright (c) Danny França <mailto:contato@dannyfranca.com>
