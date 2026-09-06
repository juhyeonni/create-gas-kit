import { useState } from 'preact/hooks'
import { Button } from '@/components/ui/Button'

export function ClientCounter() {
  const [count, setCount] = useState(0)

  return (
    <div class="counter">
      <h2>Client counter</h2>
      <div class="counter-value">{count}</div>
      <Button onClick={() => setCount((c) => c + 1)}>+1</Button>
      <Button onClick={() => setCount(0)}>Reset</Button>
    </div>
  )
}
