import type { Action, Api } from '../shared/api'
import { counter } from './counter'

const api: Api = { ...counter }

export function doGet(): GoogleAppsScript.HTML.HtmlOutput {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('__APP_NAME__')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
}

export function include(name: string): string {
  return HtmlService.createHtmlOutputFromFile(name).getContent()
}

export function rpc(action: Action, args: unknown[]): unknown {
  const fn = api[action] as ((...args: unknown[]) => unknown) | undefined
  if (typeof fn !== 'function') throw new Error(`Unknown action: ${action}`)
  return fn.apply(api, args)
}
