import { createApp } from 'vue'
import './index.css'
import App from './App.vue'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app not found')

createApp(App).mount(app)
