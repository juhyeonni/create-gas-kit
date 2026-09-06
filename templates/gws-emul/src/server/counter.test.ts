import { describe, it, expect } from 'vitest'
import '@gws-emul/core/vitest-setup'
import { counter } from './counter'

describe('counter', () => {
  it('increments and resets', () => {
    counter.increment()
    expect(counter.increment()).toBe(2)
    expect(counter.reset()).toBe(0)
  })
})
