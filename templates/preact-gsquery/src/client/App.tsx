import { kit } from './kit'
import { ClientCounter } from './components/ClientCounter'
import { ServerCounter } from './components/ServerCounter'
import { Notes } from './components/Notes'

export function App() {
  return (
    <div class="app">
      <header class="header">
        <h1>{kit.name}</h1>
        <p class="specs">create-gas-kit · {kit.specs.join(' · ')}</p>
      </header>
      <ClientCounter />
      <ServerCounter />
      <Notes />
    </div>
  )
}
