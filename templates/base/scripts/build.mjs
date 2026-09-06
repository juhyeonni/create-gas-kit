#!/usr/bin/env node
import { buildWebApp, createUI } from 'gas-app-kit'

await buildWebApp().catch((err) => createUI('build').fail(err.message))
