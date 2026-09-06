import { ClientCounter } from './components/ClientCounter'
import { ServerCounter } from './components/ServerCounter'

export function App() {
  return (
    <div className="app">
      <ClientCounter />
      <ServerCounter />
    </div>
  )
}
