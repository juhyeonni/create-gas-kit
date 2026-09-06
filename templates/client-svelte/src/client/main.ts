import { mount } from 'svelte'
import './index.css'
import App from './App.svelte'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app not found')

mount(App, { target: app })
