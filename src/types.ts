import { Subject, Subscription } from 'rxjs'

export interface SubjectPool {
  [key: string]: Subject<any>
}

export interface SubscriptionNamespaces {
  [key: string]: Subscription
}

export interface EventObject {
  eventName: string
  namespaces: string[]
}

export interface CheckManyAndThrowConfig {
  [message: string]: any
}

export type SubscriptionCallback = (...args: any[]) => void

export type ErrorHandler = (error: Error) => void
