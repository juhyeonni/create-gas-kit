import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function ClientCounter() {
  const [count, setCount] = useState(0)

  return (
    <div className="counter">
      <h2>Client counter</h2>
      <div className="counter-value">{count}</div>
      <Button onClick={() => setCount((c) => c + 1)}>+1</Button>
      <Button onClick={() => setCount(0)}>Reset</Button>
    </div>
  )
}
