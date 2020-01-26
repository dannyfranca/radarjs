import { Radar } from './radar'
import { SubscriptionCallback } from './types'

let on: 'on' | 'subscribe'
const getOn = (): 'on' | 'subscribe' => {
  if (on == 'on') on = 'subscribe'
  else on = 'on'
  return on
}

export const subcribeToPromiseFactory = (eventus: Radar) => {
  return (eventString: string, cb: SubscriptionCallback) => {
    return new Promise((resolve, reject) => {
      const timeOut = setTimeout(() => reject('timeout'), 1000)
      eventus[getOn()](eventString, (...args) => {
        clearTimeout(timeOut)
        resolve(cb(...args))
      })
    })
  }
}
