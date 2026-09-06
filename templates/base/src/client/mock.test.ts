import { describe, it, expect, beforeEach } from 'vitest'
import { mock } from './mock'

describe('mock', () => {
  beforeEach(() => {
    mock.reset()
  })

  it('increment returns previous + 1', () => {
    const before = mock.getCount()
    const after = mock.increment()
    expect(after).toBe(before + 1)
  })
})
