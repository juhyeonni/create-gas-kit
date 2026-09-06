import type { Action, Api } from '../shared/api'
import { mock } from './mock'

interface GasRun {
  withSuccessHandler(fn: (value: unknown) => void): GasRun
  withFailureHandler(fn: (error: Error) => void): GasRun
  rpc(action: string, args: unknown[]): void
}

declare const google: { script?: { run: GasRun } } | undefined

export function call<A extends Action>(
  action: A,
  ...args: Parameters<Api[A]>
): Promise<ReturnType<Api[A]>> {
  if (typeof google !== 'undefined' && google?.script?.run) {
    return new Promise((resolve, reject) => {
      google
        .script!.run.withSuccessHandler(resolve as (value: unknown) => void)
        .withFailureHandler(reject)
        .rpc(action, args)
    })
  }
  const fn = mock[action] as (...args: unknown[]) => ReturnType<Api[A]>
  return Promise.resolve(fn(...args))
}
