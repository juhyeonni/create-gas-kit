import { render } from 'preact'
import './index.css'
import { App } from './App'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app not found')

render(<App />, app)
