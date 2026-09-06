const KEY = 'count'

function readCount(): number {
  const value = PropertiesService.getScriptProperties().getProperty(KEY)
  return value ? Number(value) : 0
}

function writeCount(value: number): number {
  PropertiesService.getScriptProperties().setProperty(KEY, String(value))
  return value
}

function withLock<T>(fn: () => T): T {
  const lock = LockService.getScriptLock()
  lock.waitLock(10000)
  try {
    return fn()
  } finally {
    lock.releaseLock()
  }
}

export const counter = {
  getCount() {
    return readCount()
  },
  increment() {
    return withLock(() => writeCount(readCount() + 1))
  },
  reset() {
    return withLock(() => writeCount(0))
  },
}
