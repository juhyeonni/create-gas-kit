export interface Api {
  getCount(): number
  increment(): number
  reset(): number
}

export type Action = keyof Api
