import type { Api } from '../shared/api'

let count = 0

export const mock: Api = {
  getCount() {
    return count
  },
  increment() {
    count += 1
    return count
  },
  reset() {
    count = 0
    return count
  },
}
