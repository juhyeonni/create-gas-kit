import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app not found')

createRoot(app).render(<App />)
