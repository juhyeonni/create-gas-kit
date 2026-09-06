import { ClientCounter } from './components/ClientCounter'
import { ServerCounter } from './components/ServerCounter'
import { Notes } from './components/Notes'

export function App() {
  return (
    <div className="app">
      <ClientCounter />
      <ServerCounter />
      <Notes />
    </div>
  )
}
