import { Subject, Subscription } from 'rxjs'
import { CheckManyAndThrowConfig, ErrorHandler } from './types'
import {
  SubjectPool,
  SubscriptionNamespaces,
  EventObject,
  SubscriptionCallback
} from './types'

export class Radar {
  private _subjectPool: SubjectPool = {}
  private _subscriptionNamespaces: SubscriptionNamespaces = {}
  private _errorHandler: ErrorHandler = (error: Error) => {
    throw error
  }

  /**
   * Add a listener to an event with a given callback.
   * @param eventString Event name with namespaces.
   * @param cb Callback receiving event data from arguments
   * ```typescript
   * radar.on('event.namespace1.namespace2', (...args) => {...})
   * ```
   */
  on(eventString: string, cb: SubscriptionCallback): void {
    const { eventName, namespaces } = Radar.formatEventString(eventString)

    this.checkAndThrow(!eventName, 'event must have a name')

    const subscription = this.subscribeToSubject(eventName, cb)
    this.subscribeToNamespaces(namespaces, subscription)
  }

  /**
   * Alias to [[Radar.on]] method
   */
  subscribe(name: string, cb: SubscriptionCallback) {
    return this.on(name, cb)
  }

  /**
   * Remove listeners from an event of namespace
   * ```typescript
   * radar.off('event')
   * radar.off('.namespace')
   * ```
   */
  off(eventString: string): void {
    const { eventName, namespaces } = Radar.formatEventString(eventString)

    this.checkManyAndThrow({
      'To turn events off, reference a name or namespace, not both':
        namespaces.length && eventName,
      'eventString must reference an event name or namespace':
        !namespaces.length && !eventName,
      "Private events can't be disabled": eventName && eventName.startsWith('$')
    })

    if (namespaces.length) this.unsubscribeNamespaces(namespaces)
    else this.unsubscribeEvent(eventName)
  }

  /**
   * Alias to [[Radar.off]] method
   */
  unsubscribe(name: string) {
    return this.off(name)
  }

  /**
   * Trigger an event with given data as arguments
   * @param name event name to trigger
   * @param args data to be sent as data to event
   * ```typescript
   * radar.trigger('event', ...data)
   * ```
   */
  trigger(name: string, ...args: any[]): void {
    const subject = this._subjectPool[name]
    if (subject) subject.next(args)
  }

  /**
   * Alias to [[Radar.trigger]] method
   */
  next(name: string, ...args: any[]): void {
    this.trigger(name, ...args)
  }

  /**
   * Set error handler.
   * Default: (error) => throw error
   * ```typescript
   * radar.setErrorHandler(error => {....})
   * ```
   */
  setErrorHandler(handler: ErrorHandler): void {
    this._errorHandler = handler
  }

  private subscribeToSubject(
    name: string,
    cb: SubscriptionCallback
  ): Subscription {
    return this.getSubject(name).subscribe({
      next: (args: any[]) => cb(...args)
    })
  }

  private getSubject(name: string): Subject<any> {
    this._subjectPool[name] = this._subjectPool[name] || new Subject<any[]>()
    return this._subjectPool[name]
  }

  private getSubscriptionNamespace(namespace: string): Subscription {
    this._subscriptionNamespaces[namespace] =
      this._subscriptionNamespaces[namespace] || new Subscription()
    return this._subscriptionNamespaces[namespace]
  }

  private unsubscribeEvent(eventName: string): void {
    const subject = this._subjectPool[eventName]
    if (subject) subject.unsubscribe()
    delete this._subjectPool[eventName]
  }

  private subscribeToNamespaces(
    namespaces: string[],
    subscription: Subscription
  ): void {
    namespaces.forEach(namespace => {
      const namespaceSubscription = this.getSubscriptionNamespace(namespace)
      namespaceSubscription.add(subscription)
    })
  }

  private unsubscribeNamespaces(namespaces: string[]): void {
    namespaces.forEach(namespace => this.unsubscribeNamespace(namespace))
  }

  private unsubscribeNamespace(namespace: string): void {
    const namespaceSubscription = this._subscriptionNamespaces[namespace]
    if (namespaceSubscription) namespaceSubscription.unsubscribe()
  }

  static formatEventString(eventString: string): EventObject {
    const eventArray = eventString.split('.')
    const eventName = eventArray[0]
    eventArray.shift()
    return {
      eventName,
      namespaces: eventArray.filter(Boolean)
    }
  }

  private checkManyAndThrow(config: CheckManyAndThrowConfig): void {
    for (const key in config) this.checkAndThrow(config[key], key)
  }

  private checkAndThrow(test: any, errorMessage: string): void {
    if (!test) return
    const error = new Error(errorMessage)
    this.trigger('$error', error)
    this._errorHandler(error)
  }
}
