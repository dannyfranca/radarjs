import { Radar } from './radar'
import { SubscriptionCallback } from './types'

export const subcribeToPromiseFactory = (radar: Radar) => {
  return (eventString: string, cb: SubscriptionCallback) => {
    return new Promise((resolve, reject) => {
      const timeOut = setTimeout(() => reject('timeout'), 1000)
      radar.onSync(eventString, (...args) => {
        clearTimeout(timeOut)
        resolve(cb(...args))
      })
    })
  }
}
