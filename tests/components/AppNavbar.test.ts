import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { compileSFC } from '../compiler-helper'

interface MockMQL {
  matches: boolean
  media: string
  onchange: null
  addEventListener: (event: string, handler: (event: { matches: boolean }) => void) => void
  removeEventListener: (event: string, handler: (event: { matches: boolean }) => void) => void
  dispatchEvent: () => boolean
}

const noopMql: MockMQL = {
  matches: false,
  media: '',
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
}

function setupMatchMedia(isDark: boolean) {
  const mql: MockMQL = {
    matches: isDark,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }

  ;(globalThis as any).matchMedia = (query: string) => {
    if (query === '(prefers-color-scheme: dark)') return mql
    return { ...noopMql, media: query }
  }
}

describe('AppNavbar.vue SFC', () => {
  it('parses and compiles successfully', () => {
    const result = compileSFC('app/components/AppNavbar.vue')
    expect(result.script).toBeDefined()
    expect(result.render).toBeDefined()
  })

  it('script uses useTheme composable', () => {
    const result = compileSFC('app/components/AppNavbar.vue')
    expect(result.script).toContain('useTheme')
    expect(result.script).toContain('toggleTheme')
    expect(result.script).toContain('themeTitle')
  })

  it('script setup calls useTheme composable', () => {
    const source = readFileSync('app/components/AppNavbar.vue', 'utf-8')
    expect(source).toContain('useTheme()')
  })

  it('template renders nav with heading and theme button', () => {
    const result = compileSFC('app/components/AppNavbar.vue')
    expect(result.render).toContain('fixed top-0 left-0 right-0')
    expect(result.render).toContain('Todooo')
    expect(result.render).toContain('toggleTheme')
    expect(result.render).toContain('themeTitle')
  })

  it('template has three icon variants with light/dark/system conditions', () => {
    const result = compileSFC('app/components/AppNavbar.vue')
    const iconKeys = result.render.match(/key: \d/g)
    expect(iconKeys).toHaveLength(3)
  })

  it('source has all three SVG icons (light, dark, monitor)', () => {
    const source = readFileSync('app/components/AppNavbar.vue', 'utf-8')
    const lightSvgMatches = source.match(/v-if="theme === 'light'"/g)
    expect(lightSvgMatches).toHaveLength(1)
    const darkSvgMatches = source.match(/v-else-if="theme === 'dark'"/g)
    expect(darkSvgMatches).toHaveLength(1)
    const systemSvgMatches = source.match(/v-else/g)
    expect(systemSvgMatches).toBeTruthy()
  })
})

describe('AppNavbar theme toggle interaction', () => {
  it('cycles light -> dark -> system -> light via toggleTheme', () => {
    setupMatchMedia(true)

    const { useTheme } = require('../../app/composables/useTheme')
    const { theme, resolvedTheme, toggleTheme } = useTheme()

    expect(theme.value).toBe('system')

    toggleTheme()
    expect(theme.value).toBe('light')
    expect(resolvedTheme.value).toBe('light')

    toggleTheme()
    expect(theme.value).toBe('dark')
    expect(resolvedTheme.value).toBe('dark')

    toggleTheme()
    expect(theme.value).toBe('system')
    expect(resolvedTheme.value).toBe('dark')
  })

  it('sets correct tooltip titles in source for all three themes', () => {
    const source = readFileSync('app/components/AppNavbar.vue', 'utf-8')
    expect(source).toContain('Skift til mørk tilstand')
    expect(source).toContain('Skift til systemtilstand')
    expect(source).toContain('Skift til lys tilstand')
  })
})
