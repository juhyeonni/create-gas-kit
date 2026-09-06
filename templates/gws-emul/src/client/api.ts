import type { Action, Api } from '../shared/api'

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
  if (typeof google === 'undefined' || !google?.script?.run) {
    return Promise.reject(
      new Error(
        'google.script.run is not available — run the dev server with the gws-emul vite plugin',
      ),
    )
  }
  return new Promise((resolve, reject) => {
    google
      .script!.run.withSuccessHandler(resolve as (value: unknown) => void)
      .withFailureHandler(reject)
      .rpc(action, args)
  })
}
