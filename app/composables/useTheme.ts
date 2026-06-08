import { ref, computed, watch, watchEffect } from 'vue'

type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'todooo-theme'

const canLocalStorage = typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function'
const canMatchMedia = typeof matchMedia !== 'undefined' && typeof matchMedia === 'function'
const canDocument = typeof document !== 'undefined' && typeof document.documentElement !== 'undefined'

export function useTheme() {
  const saved = canLocalStorage
    ? localStorage.getItem(STORAGE_KEY) as Theme | null
    : null
  const theme = ref<Theme>(saved ?? 'system')

  const mql = canMatchMedia ? matchMedia('(prefers-color-scheme: dark)') : null
  const prefersDark = ref(mql?.matches ?? false)

  mql?.addEventListener('change', (e: MediaQueryListEvent) => {
    prefersDark.value = e.matches
  })

  const resolvedTheme = computed(() => {
    if (theme.value === 'system') {
      return prefersDark.value ? 'dark' : 'light'
    }
    return theme.value
  })

  watchEffect(() => {
    const isDark = resolvedTheme.value === 'dark'
    if (canDocument) {
      document.documentElement.classList.toggle('dark', isDark)
    }
  })

  watch(theme, (val) => {
    if (canLocalStorage) {
      localStorage.setItem(STORAGE_KEY, val)
    }
  }, { flush: 'sync' })

  function toggleTheme() {
    const next: Record<Theme, Theme> = { light: 'dark', dark: 'system', system: 'light' }
    theme.value = next[theme.value]
  }

  return {
    theme,
    resolvedTheme,
    toggleTheme,
  }
}
