import './index.css'
import { call } from './api'
import { kit } from './kit'

function renderCounter(container: HTMLElement, title: string) {
  container.innerHTML = `
    <h2>${title}</h2>
    <div class="counter-value">0</div>
    <button class="button" type="button" data-action="increment">+1</button>
    <button class="button" type="button" data-action="reset">Reset</button>
  `
}

function setValue(container: HTMLElement, value: number) {
  container.querySelector('.counter-value')!.textContent = String(value)
}

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app not found')

app.classList.add('app')
app.innerHTML = `
  <header class="header">
    <h1>${kit.name}</h1>
    <p class="specs">create-gas-kit · ${kit.specs.join(' · ')}</p>
  </header>
  <div class="counter" id="client-counter"></div>
  <div class="counter" id="server-counter"></div>
  <p class="error" id="error" hidden></p>
`

const clientCounter = app.querySelector<HTMLElement>('#client-counter')!
const serverCounter = app.querySelector<HTMLElement>('#server-counter')!
const errorEl = app.querySelector<HTMLElement>('#error')!

renderCounter(clientCounter, 'Client counter')
renderCounter(serverCounter, 'Server counter')

function showError(err: unknown) {
  errorEl.textContent = err instanceof Error ? err.message : String(err)
  errorEl.hidden = false
}

let clientCount = 0
clientCounter.addEventListener('click', (e) => {
  const action = (e.target as HTMLElement).dataset.action
  if (action === 'increment') clientCount += 1
  if (action === 'reset') clientCount = 0
  setValue(clientCounter, clientCount)
})

serverCounter.addEventListener('click', async (e) => {
  const action = (e.target as HTMLElement).dataset.action
  if (action !== 'increment' && action !== 'reset') return
  try {
    setValue(serverCounter, await call(action))
  } catch (err) {
    showError(err)
  }
})

call('getCount')
  .then((value) => setValue(serverCounter, value))
  .catch(showError)
