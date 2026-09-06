import { useEffect, useState } from 'preact/hooks'
import { call } from '../api'
import { Button } from '@/components/ui/Button'

export function ServerCounter() {
  const [count, setCount] = useState(0)
  const [error, setError] = useState<string>()

  function showError(err: unknown) {
    setError(err instanceof Error ? err.message : String(err))
  }

  useEffect(() => {
    call('getCount').then(setCount).catch(showError)
  }, [])

  async function run(action: 'increment' | 'reset') {
    try {
      setCount(await call(action))
    } catch (err) {
      showError(err)
    }
  }

  return (
    <div class="counter">
      <h2>Server counter</h2>
      <div class="counter-value">{count}</div>
      <Button onClick={() => run('increment')}>+1</Button>
      <Button onClick={() => run('reset')}>Reset</Button>
      {error && <p class="error">{error}</p>}
    </div>
  )
}
