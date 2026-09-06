import { kit } from './kit'
import { ClientCounter } from './components/ClientCounter'
import { ServerCounter } from './components/ServerCounter'

export function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>{kit.name}</h1>
        <p className="specs">create-gas-kit · {kit.specs.join(' · ')}</p>
      </header>
      <ClientCounter />
      <ServerCounter />
    </div>
  )
}
