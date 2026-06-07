import { describe, it, expect, beforeEach, afterEach } from 'vitest'

const STORAGE_KEY = 'todooo-theme'

interface MockMQL {
  matches: boolean
  media: string
  onchange: null
  _listeners: Set<(event: { matches: boolean }) => void>
  addEventListener: (event: string, handler: (event: { matches: boolean }) => void) => void
  removeEventListener: (event: string, handler: (event: { matches: boolean }) => void) => void
  dispatchEvent: () => boolean
}

let mockMql: MockMQL | null = null
let origLocalStorage: Storage | undefined
let origMatchMedia: ((query: string) => MediaQueryList) | undefined

function expectDarkClass(expected: boolean) {
  if (typeof document !== 'undefined' && document.documentElement) {
    expect(document.documentElement.classList.contains('dark')).toBe(expected)
  }
}

const noopMql = {
  matches: false,
  media: '',
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
}

beforeEach(() => {
  origLocalStorage = globalThis.localStorage
  origMatchMedia = globalThis.matchMedia as unknown as ((query: string) => MediaQueryList) | undefined

  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.classList.remove('dark')
  }

  const store = new Map<string, string>()
  ;(globalThis as any).localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value) },
    removeItem: (key: string) => { store.delete(key) },
    clear: () => { store.clear() },
    get length() { return store.size },
    key: (index: number) => [...store.keys()][index] ?? null,
  }
})

afterEach(() => {
  if (origLocalStorage) (globalThis as any).localStorage = origLocalStorage
  if (origMatchMedia) (globalThis as any).matchMedia = origMatchMedia
  mockMql = null
})

function setupMatchMedia(isDark: boolean) {
  const listeners = new Set<(event: { matches: boolean }) => void>()
  const mql: MockMQL = {
    matches: isDark,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    _listeners: listeners,
    addEventListener: (_event: string, handler: (event: { matches: boolean }) => void) => {
      listeners.add(handler)
    },
    removeEventListener: (_event: string, handler: (event: { matches: boolean }) => void) => {
      listeners.delete(handler)
    },
    dispatchEvent: () => false,
  }
  mockMql = mql

  ;(globalThis as any).matchMedia = (query: string) => {
    if (query === '(prefers-color-scheme: dark)') return mql
    return { ...noopMql, media: query }
  }
}

function simulateColorSchemeChange(isDark: boolean) {
  if (mockMql) {
    mockMql.matches = isDark
    mockMql._listeners.forEach(fn => fn({ matches: isDark }))
  }
}

describe('useTheme', () => {
  it('defaults to system theme on first visit and resolves to dark when prefers-color-scheme is dark', () => {
    setupMatchMedia(true)

    const { useTheme } = require('../../app/composables/useTheme')
    const { theme, resolvedTheme } = useTheme()

    expect(theme.value).toBe('system')
    expect(resolvedTheme.value).toBe('dark')
    expectDarkClass(true)
  })

  it('restores saved theme from localStorage', () => {
    setupMatchMedia(true)
    localStorage.setItem(STORAGE_KEY, 'light')

    const { useTheme } = require('../../app/composables/useTheme')
    const { theme, resolvedTheme } = useTheme()

    expect(theme.value).toBe('light')
    expect(resolvedTheme.value).toBe('light')
    expectDarkClass(false)
  })

  it('resolves system theme to light when prefers-color-scheme is light', () => {
    setupMatchMedia(false)

    const { useTheme } = require('../../app/composables/useTheme')
    const { theme, resolvedTheme } = useTheme()

    expect(theme.value).toBe('system')
    expect(resolvedTheme.value).toBe('light')
    expectDarkClass(false)
  })

  it('toggles through system -> light -> dark -> system', () => {
    setupMatchMedia(true)

    const { useTheme } = require('../../app/composables/useTheme')
    const { theme, resolvedTheme, toggleTheme } = useTheme()

    expect(theme.value).toBe('system')

    toggleTheme()
    expect(theme.value).toBe('light')
    expect(resolvedTheme.value).toBe('light')
    expectDarkClass(false)

    toggleTheme()
    expect(theme.value).toBe('dark')
    expect(resolvedTheme.value).toBe('dark')
    expectDarkClass(true)

    toggleTheme()
    expect(theme.value).toBe('system')
    expect(resolvedTheme.value).toBe('dark')
  })

  it('persists theme preference to localStorage on toggle', () => {
    setupMatchMedia(true)

    const { useTheme } = require('../../app/composables/useTheme')
    const { toggleTheme } = useTheme()

    toggleTheme()
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light')

    toggleTheme()
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark')

    toggleTheme()
    expect(localStorage.getItem(STORAGE_KEY)).toBe('system')
  })

  it('reacts to prefers-color-scheme changes when in system mode', () => {
    setupMatchMedia(true)

    const { useTheme } = require('../../app/composables/useTheme')
    const { theme, resolvedTheme } = useTheme()

    expect(theme.value).toBe('system')

    simulateColorSchemeChange(false)
    expect(resolvedTheme.value).toBe('light')
    expectDarkClass(false)

    simulateColorSchemeChange(true)
    expect(resolvedTheme.value).toBe('dark')
    expectDarkClass(true)
  })
})
