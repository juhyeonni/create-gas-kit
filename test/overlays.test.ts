import { test } from 'node:test'
import assert from 'node:assert/strict'
import { overlayList } from '../src/overlays.ts'

test('vanilla, no extras: base + client-vanilla only', () => {
  assert.deepEqual(
    overlayList({
      client: 'vanilla',
      ui: 'none',
      shadcn: false,
      gsquery: false,
      gwsEmul: false,
    }),
    ['base', 'client-vanilla'],
  )
})

test('react + tailwind + shadcn', () => {
  assert.deepEqual(
    overlayList({
      client: 'react',
      ui: 'tailwind',
      shadcn: true,
      gsquery: false,
      gwsEmul: false,
    }),
    ['base', 'client-react', 'tailwind', 'shadcn'],
  )
})

test('gsquery adds the shared overlay and the client-specific combo dir', () => {
  assert.deepEqual(
    overlayList({
      client: 'vanilla',
      ui: 'none',
      shadcn: false,
      gsquery: true,
      gwsEmul: false,
    }),
    ['base', 'client-vanilla', 'gsquery', 'vanilla-gsquery'],
  )
})

test('react + gsquery uses the react combo dir', () => {
  assert.deepEqual(
    overlayList({
      client: 'react',
      ui: 'none',
      shadcn: false,
      gsquery: true,
      gwsEmul: false,
    }),
    ['base', 'client-react', 'gsquery', 'react-gsquery'],
  )
})

test('vue + gsquery uses the vue combo dir', () => {
  assert.deepEqual(
    overlayList({
      client: 'vue',
      ui: 'none',
      shadcn: false,
      gsquery: true,
      gwsEmul: false,
    }),
    ['base', 'client-vue', 'gsquery', 'vue-gsquery'],
  )
})

test('everything on, in overlay order', () => {
  assert.deepEqual(
    overlayList({
      client: 'react',
      ui: 'tailwind',
      shadcn: true,
      gsquery: true,
      gwsEmul: true,
    }),
    [
      'base',
      'client-react',
      'tailwind',
      'shadcn',
      'gsquery',
      'react-gsquery',
      'gws-emul',
    ],
  )
})
