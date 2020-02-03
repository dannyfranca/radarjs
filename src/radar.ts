import { Subject, Subscription } from 'rxjs'
import {
  EventSubject,
  CheckManyAndThrowConfig,
  ErrorHandler,
  SubjectTree,
  SubjectRelation,
  SubjectPool,
  SubscriptionTags,
  EventObject,
  SubscriptionCallback
} from './types'

export class Radar {
  private readonly _subjectPool: SubjectPool = {}
  private readonly _subscriptionTags: SubscriptionTags = {}
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
   * @param eventString Event name with tags.
   * @param cb Callback receiving event data from arguments
   * ```typescript
   * radar.on('event.tag1.tag2', (...args) => {...})
   * ```
   */
  on(eventString: string, cb: SubscriptionCallback) {
    return Radar.toPromise(() => this.onSync(eventString, cb))
  }

  /**
   * Same as [[Radar.on]], but synchronous
   */
  onSync(eventString: string, cb: SubscriptionCallback) {
    const { eventName, tags: tags } = Radar.formatEventString(eventString)

    if (this.checkAndThrow(!eventName, 'event must have a name')) return

    this.autoEventTree(eventName)

    const subscription = this.subscribeToSubject(eventName, cb)
    this.subscribeToTags(tags, subscription)

    return subscription
  }

  private autoEventTree(eventName: string): void {
    const eventNames = Radar.generateEventTreeNames(eventName)

    if (!eventNames.length) return

    eventNames.reduce((accumulator, currentValue) => {
      this.link(accumulator, currentValue)
      return currentValue
    })
  }

  static generateEventTreeNames(eventName: string): string[] {
    const eventNames: string[] = []
    const eventNamesFragments = eventName.split(':').filter(Boolean)

    if (!eventNamesFragments.length) return []

    Radar.insertEventTreeNames(eventNames, eventNamesFragments)

    return eventNames
  }

  private static insertEventTreeNames(
    eventNames: string[],
    eventNamesFragments: string[]
  ): void {
    eventNames.push(eventNamesFragments[0])
    eventNamesFragments.reduce((accumulator, currentValue) => {
      const currentEventName = `${accumulator}:${currentValue}`
      eventNames.push(currentEventName)
      return currentEventName
    })
  }

  /**
   * Remove listeners from an event of tag
   * ```typescript
   * radar.off('event')
   * radar.off('.tag')
   * ```
   */
  off(eventString: string) {
    return Radar.toPromise(() => this.offSync(eventString))
  }

  /**
   * Same as [[Radar.off]], but synchronous.
   */
  offSync(eventString: string): void {
    const { eventName, tags } = Radar.formatEventString(eventString)

    if (
      this.checkManyAndThrow({
        'To turn events off, reference a name or tag, not both':
          tags.length && eventName,
        'eventString must reference an event name or tag':
          !tags.length && !eventName,
        "Private events can't be disabled":
          eventName && eventName.startsWith('$')
      })
    )
      return

    if (tags.length) this.unsubscribeTags(tags)
    else this.unsubscribeEvent(eventName)
  }

  /**
   * Trigger an event with given data as arguments
   * @param eventName event name to trigger
   * @param args data to be sent as data with event
   * ```typescript
   * radar.trigger('event', ...data)
   * ```
   */
  trigger(eventName: string, ...args: any[]): Promise<void> {
    return Radar.toPromise<void>(() => this.triggerSync(eventName, ...args))
  }

  /**
   * Same as [[Radar.trigger]], but synchronous
   */
  triggerSync(eventName: string, ...args: any[]): void {
    this.triggerSubject(eventName, ...args)
  }

  private triggerSubject(eventName: string, ...args: any[]): void {
    const subject = this._subjectPool[eventName]
    if (subject) subject.next(args)
  }

  /**
   * Trigger an event and their parents with given data as arguments
   * @param eventName event name to emit
   * @param args data to be sent as data with event to parents
   */
  emit(eventName: string, ...args: any[]): Promise<void> {
    return Radar.toPromise(() => this.emitSync(eventName, ...args))
  }

  /**
   * Same as [[Radar.emit]], but synchronous
   */
  emitSync(eventName: string, ...args: any[]): void {
    this.triggerSync(eventName, ...args)
    for (const name of this.getParentNames(eventName)) {
      this.emitSync(name, ...args)
    }
  }

  /**
   * Trigger an event and their children with given data as arguments
   * @param eventName event name to trigger
   * @param args data to be sent as data with event to children
   */
  broadcast(eventName: string, ...args: any[]): Promise<void> {
    return Radar.toPromise(() => this.broadcastSync(eventName, ...args))
  }

  /**
   * Same as [[Radar.broadcast]], but synchronous
   */
  broadcastSync(eventName: string, ...args: any[]): void {
    this.triggerSync(eventName, ...args)
    for (const name of this.getChildrenNames(eventName)) {
      this.broadcastSync(name, ...args)
    }
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
        `${childName} is already parent of ${parentName}.`
      )
    )
      return

    this.setRelation(parentName, childName)
  }

  /**
   * Create a relation event tree
   * @param stringTree event names separated by dots
   * ```typescript
   * radar.linkTree('foo.bar.baz')
   * // same as
   * radar.link('foo', 'bar')
   * radar.link('bar', 'baz')
   * ```
   */
  linkTree(stringTree: string): void {
    const eventNames = stringTree.split('.').filter(Boolean)

    if (!eventNames.length) return

    eventNames.reduce((accumulator, currentValue) => {
      this.link(accumulator, currentValue)
      return currentValue
    })
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
   * Check a relation between a parent and a child
   * @param parent parent event name
   * @param child child event name
   */
  hasChild(parent: string, child: string): boolean {
    const relation = this.getRelation(parent)
    return relation.children[child]
  }

  static toPromise<T = any>(arg: Function): Promise<T> {
    return new Promise((resolve, reject) => {
      let resolvedValue: any
      try {
        resolvedValue = arg()
      } catch (error) {
        reject(error)
      }
      resolve(resolvedValue)
    })
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

  private getSubscriptionTag(tag: string): Subscription {
    this._subscriptionTags[tag] =
      this._subscriptionTags[tag] || new Subscription()
    return this._subscriptionTags[tag]
  }

  private unsubscribeEvent(eventName: string): void {
    const subject = this._subjectPool[eventName]
    if (subject) subject.unsubscribe()
    delete this._subjectPool[eventName]
  }

  private subscribeToTags(tag: string[], subscription: Subscription): void {
    tag.forEach(tag => {
      const tagSubscription = this.getSubscriptionTag(tag)
      tagSubscription.add(subscription)
    })
  }

  private unsubscribeTags(tags: string[]): void {
    tags.forEach(tag => this.unsubscribeTag(tag))
  }

  private unsubscribeTag(tag: string): void {
    const tagSubscription = this._subscriptionTags[tag]
    if (tagSubscription) tagSubscription.unsubscribe()
  }

  static formatEventString(eventString: string): EventObject {
    const eventArray = eventString.split('.')
    const eventName = eventArray[0]
    eventArray.shift()
    return {
      eventName,
      tags: eventArray.filter(Boolean)
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
    this.triggerSync('$error', error)
    this.errorHandler(error)
    return true
  }
}
