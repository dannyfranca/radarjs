import { Subject, Subscription } from 'rxjs'
import { matchKeys } from 'micromatch'
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
    const eventNames = Radar.generateAutoEventTreeNames(eventName)

    if (!eventNames.length) return

    eventNames.reduce((accumulator, currentValue) => {
      this.linkSync(accumulator, currentValue)
      return currentValue
    })
  }

  static generateAutoEventTreeNames(eventName: string): string[] {
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
   * Trigger events with given names and data as arguments
   * @param eventName event names to trigger. Names can be a string separated by dots or an array of strings
   * @param args data to be sent as data with event
   * ```typescript
   * radar.trigger('event', ...data)
   * ```
   */
  trigger(eventNames: string | string[], ...args: any[]) {
    return Radar.toPromise<void>(() => this.triggerSync(eventNames, ...args))
  }

  /**
   * Same as [[Radar.triggerSync]], but trigger many events
   */
  triggerSync(eventNames: string | string[], ...args: any[]): void {
    for (const eventname of this.makeStringArray(eventNames))
      this.triggerOneSync(eventname, ...args)
  }

  /**
   * Same as [[Radar.trigger]], but synchronous
   */
  triggerOneSync(eventName: string, ...args: any[]): void {
    const subjectPool = this.matchKeys(eventName)
    this.triggerSubjectPool(subjectPool as SubjectPool, args)
  }

  private matchKeys(eventName: string) {
    return matchKeys(this._subjectPool, eventName)
  }

  private triggerSubjectPool(subjectPool: SubjectPool, args: any[]): void {
    for (const subject of Object.values(subjectPool)) subject.next(args)
  }

  /**
   * Trigger, and emit to parents, events with given names and data as arguments
   * @param eventName event name to emit. Names can be a string separated by dots or an array of strings
   * @param args data to be sent as data with event to parents
   */
  emit(eventNames: string | string[], ...args: any[]): Promise<void> {
    return Radar.toPromise(() => this.emitSync(eventNames, ...args))
  }

  /**
   * Same as [[Radar.emitSync]], but emits many events
   */
  emitSync(eventNames: string | string[], ...args: any[]): void {
    for (const eventName of this.makeStringArray(eventNames))
      this.emitOneSync(eventName, ...args)
  }

  /**
   * Same as [[Radar.emit]], but synchronous
   */
  emitOneSync(eventName: string, ...args: any[]): void {
    this.triggerOneSync(eventName, ...args)
    const name = this.getParentName(eventName)
    if (name) this.emitOneSync(name, ...args)
  }

  /**
   * Trigger, and broadcast to children, events with given names and data as arguments
   * @param eventName event name to broadcast. Names can be a string separated by dots or an array of strings
   * @param args data to be sent as data with event to children
   */
  broadcast(eventNames: string | string[], ...args: any[]): Promise<void> {
    return Radar.toPromise(() => this.broadcastSync(eventNames, ...args))
  }

  /**
   * Same as [[Radar.broadcastSync]], but broadcasts many events
   */
  broadcastSync(eventNames: string | string[], ...args: any[]): void {
    for (const eventName of this.makeStringArray(eventNames))
      this.broadcastOneSync(eventName, ...args)
  }

  /**
   * Same as [[Radar.broadcast]], but synchronous
   */
  broadcastOneSync(eventName: string, ...args: any[]): void {
    this.triggerOneSync(eventName, ...args)
    for (const name of this.getChildrenNames(eventName)) {
      this.broadcastOneSync(name, ...args)
    }
  }

  private makeStringArray(eventNames: string | string[]): string[] {
    if (typeof eventNames == 'string')
      return eventNames.split('.').filter(Boolean)
    return eventNames
  }

  /**
   * Create a relation between a parent event and a child one
   * @param parentName event name to be parent
   * @param childName event name to be child
   */
  link(parentName: string, childName: string) {
    return Radar.toPromise(() => this.linkSync(parentName, childName))
  }

  /**
   * Same as [[Radar.link]], but synchronous
   */
  linkSync(parentName: string, childName: string): void {
    if (
      this.checkManyAndThrow({
        [`${childName} already has a parent`]: this.hasParent(
          childName,
          parentName
        ),
        [`${childName} is already parent of ${parentName}`]: this.getChild(
          childName,
          parentName
        )
      })
    )
      return

    this.setRelation(parentName, childName)
  }

  hasParent(child: string, ignoreParent?: string): boolean {
    const parentName = this.getRelation(child).parent.name
    if (!parentName) return false
    return parentName !== ignoreParent
  }

  /**
   * Check a relation between a parent and a child
   * @param parent parent event name
   * @param child child event name
   */
  getChild(parent: string, child: string) {
    return this.getRelation(parent).children[child]
  }

  private setRelation(parentName: string, childName: string): void {
    const parentRelation = this.getRelation(parentName)
    parentRelation.children[childName] = this.getRelation(childName)

    const childRelation = this.getRelation(childName)
    childRelation.parent = {
      name: parentName,
      relation: this.getRelation(childName)
    }
  }

  /**
   * Create a relation event tree
   * @param stringTree string or array of event names separated by dots
   * ```typescript
   * radar.linkTree('foo.bar.baz')
   * // same as
   * radar.link('foo', 'bar')
   * radar.link('bar', 'baz')
   *
   * // or, create many relation branches, respecting link limitations, an event can only have one parent
   * radar.linkTree([
   *  'foo.bar.baz',
   *  'parent.child'
   * ])
   * ```
   */
  linkTree(stringTree: string | string[]) {
    return Radar.toPromise(() => this.linkTreeSync(stringTree))
  }

  /**
   * Same as [[Radar.linkTree]], but synchronous
   */
  linkTreeSync(stringTree: string | string[]) {
    if (typeof stringTree == 'string') return this.linkBranchSync(stringTree)
    for (const stringBranch of stringTree) this.linkBranchSync(stringBranch)
  }

  /**
   * Same as [[Radar.linkTree]], but synchronous
   */
  linkBranchSync(stringTree: string): void {
    const eventNames = stringTree.split('.').filter(Boolean)

    if (!eventNames.length) return

    eventNames.reduce((accumulator, currentValue) => {
      this.linkSync(accumulator, currentValue)
      return currentValue
    })
  }

  /**
   * Destroy a relation between a parent event and a child one
   * @param parentName event name to be parent
   * @param childName event name to be child
   */
  unlink(parentName: string, childName: string) {
    return Radar.toPromise(() => this.unlinkSync(parentName, childName))
  }

  /**
   * Same as [[Radar.unlink]], but synchronous
   */
  unlinkSync(parentName: string, childName: string) {
    const relation = this.getRelation(parentName)
    delete relation.children[childName]
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

  private getParentName(eventName: string) {
    return this.getRelation(eventName).parent.name
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
      parent: {
        name: undefined,
        relation: {}
      },
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
    this.triggerOneSync('$error', error)
    this.errorHandler(error)
    return true
  }
}
