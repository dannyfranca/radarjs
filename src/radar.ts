import { Subject, Subscription } from 'rxjs'
import { EventSubject } from './types'
import {
  CheckManyAndThrowConfig,
  ErrorHandler,
  SubjectTree,
  SubjectRelation
} from './types'
import {
  SubjectPool,
  SubscriptionNamespaces,
  EventObject,
  SubscriptionCallback
} from './types'

export class Radar {
  private readonly _subjectPool: SubjectPool = {}
  private readonly _subscriptionNamespaces: SubscriptionNamespaces = {}
  private readonly _subjectTree: SubjectTree = {}

  /**
   * Set error handler.
   * Default: (error) => throw error
   * ```typescript
   * radar.setErrorHandler(error => {....})
   * ```
   */
  public errorHandler: ErrorHandler = (error: Error): void => {
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

    if (this.checkAndThrow(!eventName, 'event must have a name')) return

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

    if (
      this.checkManyAndThrow({
        'To turn events off, reference a name or namespace, not both':
          namespaces.length && eventName,
        'eventString must reference an event name or namespace':
          !namespaces.length && !eventName,
        "Private events can't be disabled":
          eventName && eventName.startsWith('$')
      })
    )
      return

    if (namespaces.length) this.unsubscribeNamespaces(namespaces)
    else this.unsubscribeEvent(eventName)
  }

  /**
   * Alias to [[Radar.off]] method
   */
  unsubscribe(eventName: string) {
    return this.off(eventName)
  }

  /**
   * Trigger an event with given data as arguments
   * @param eventName event name to trigger
   * @param args data to be sent as data with event
   * ```typescript
   * radar.trigger('event', ...data)
   * ```
   */
  trigger(eventName: string, ...args: any[]): void {
    const subject = this._subjectPool[eventName]
    if (subject) subject.next(args)
  }

  /**
   * Alias to [[Radar.trigger]] method
   */
  next(eventName: string, ...args: any[]): void {
    this.trigger(eventName, ...args)
  }

  /**
   * Create a relation between a parent event and a child one
   * @param parentName event name to be parent
   * @param childName event name to be child
   */
  link(parentName: string, childName: string): void {
    if (
      this.checkAndThrow(
        this.hasChild(childName, parentName),
        `${childName} is already parent of ${parentName}. You cannot create a circular relation.`
      )
    )
      return

    this.setRelation(parentName, childName)
  }

  private setRelation(parentName: string, childName: string): void {
    const parentRelation = this.getRelation(parentName)
    parentRelation.children[childName] = true

    const childRelation = this.getRelation(childName)
    childRelation.parents[parentName] = true
  }

  /**
   * Destroy a relation between a parent event and a child one
   * @param parentName event name to be parent
   * @param childName event name to be child
   */
  unlink(parentName: string, childName: string) {
    const relation = this.getRelation(parentName)
    delete relation.children[childName]
  }

  /**
   * Trigger an event and their parents with given data as arguments
   * @param eventName event name to emit
   * @param args data to be sent as data with event to parents
   */
  emit(eventName: string, ...args: any[]): void {
    this.trigger(eventName, ...args)
    for (const name of this.getParentNames(eventName)) {
      this.emit(name, ...args)
    }
  }

  /**
   * Trigger an event and their children with given data as arguments
   * @param eventName event name to trigger
   * @param args data to be sent as data with event to children
   */
  broadcast(eventName: string, ...args: any[]): void {
    this.trigger(eventName, ...args)
    for (const name of this.getChildrenNames(eventName)) {
      this.broadcast(name, ...args)
    }
  }

  /**
   * Check a relation between a parent and a child
   * @param parent parent event name
   * @param child child event name
   */
  hasChild(parent: string, child: string): boolean {
    const relation = this.getRelation(parent)
    return relation.children[child]
  }

  private subscribeToSubject(
    name: string,
    cb: SubscriptionCallback
  ): Subscription {
    return this.getSubject(name).subscribe({
      next: (args: any[]) => cb(...args)
    })
  }

  private getParentNames(eventName: string) {
    const { parents } = this.getRelation(eventName)
    return Object.keys(parents)
  }

  private getChildrenNames(eventName: string) {
    const { children } = this.getRelation(eventName)
    return Object.keys(children)
  }

  private getSubject(eventName: string): EventSubject {
    this._subjectPool[eventName] =
      this._subjectPool[eventName] || new Subject<any[]>()
    return this._subjectPool[eventName]
  }

  private getRelation(eventName: string): SubjectRelation {
    this._subjectTree[eventName] = this._subjectTree[eventName] || {
      parents: {},
      children: {}
    }
    return this._subjectTree[eventName]
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

  private checkManyAndThrow(config: CheckManyAndThrowConfig): boolean {
    for (const key in config) {
      if (this.checkAndThrow(config[key], key)) return true
    }
    return false
  }

  private checkAndThrow(test: any, errorMessage: string): boolean {
    if (!test) return false
    const error = new Error(errorMessage)
    this.trigger('$error', error)
    this.errorHandler(error)
    return true
  }
}
