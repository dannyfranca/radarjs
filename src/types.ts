import { Subject, Subscription } from 'rxjs'

export type EventSubject = Subject<any[]>

export interface SubjectPool {
  [key: string]: EventSubject
}

export interface SubscriptionTags {
  [key: string]: Subscription
}

export interface EventObject {
  eventName: string
  tags: string[]
}

export interface EventRelationObject {
  [key: string]: SubjectRelation
}

export interface SubjectRelation {
  parent: {
    name: string | undefined
    relation: SubjectRelation
  }
  children: {
    [key: string]: SubjectRelation
  }
}

export interface SubjectTree {
  [key: string]: SubjectRelation
}

export interface CheckManyAndThrowConfig {
  [message: string]: any
}

export type SubscriptionCallback = (...args: any[]) => void

export type ErrorHandler = (error: Error) => void
