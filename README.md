<h1 align="center">dannyfranca/radarjs</h1>
<p align="center">Event Manager, with namespaces, emitting, bubbling and broadcasting, made with RxJS Subjects and inspired by jQuery event API.</p>
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

# Install

## Module

### Download

```bash
npm i radarjs
```

### Import

```js
import { Radar } from '@dannyfranca/radarjs'

const radar = new Radar()
```

## CDN

```html
<script src="unpkg.com/radarjs"></script>

<!-- Specific Version -->
<script src="unpkg.com/radarjs@0.1.0/lib/radar.umd.js"></script>
```

# Usage

## Listen to Events

```js
const state = {
  count: 0,
  lastNotificationType: ''
}

radar.on('notify', () => state.count++)

// receive any number off values as arguments
radar.on('notify', ({ type }, ...data) => {
  state.lastNotificationType = type)
  console.log(data)
}

// subscribe is an alias
radar.subscribe('logout', () => {/*...*/})

// can use namespaces
radar.on('notify.namespace1.namespace2', () => {/*...*/})
```

## Unsubscribe from Events

```js
// by event name
radar.off('notify')

// unsubscribe is an alias
radar.unsubscribe('logout')

// by namespace
radar.off('.namespace1')
```

## Trigger Events

```js
// pass any data to an event trigger
radar.trigger('notify', {
  type: 'info',
  message: 'Just an ordinary notification'
})

// pass any number of data
radar.trigger('notify', notification, ...data)

// next is an alias
radar.next('logout')
```

## Native Events

Native events has reserved names starting with $. Until now, the only native event available is $error.

### $error event

```typescript
// listening to $error
radar.on('$error', (error: Error) => {/*...*/})
```

Radarjs default error handler is:

```typescript
(error: Error) => { throw error }
```

You can set yout own:

```typescript
// set your error handler
radar.setErrorHandler((error: Error) => {/*...*/})
```

# Rodamap

Here's what's coming up:

- [] Event tree
- [] Event broadcast to children
- [] Event emit to parents

# License

[MIT](./LICENSE)

Copyright (c) Danny França <mailto:contato@dannyfranca.com>
