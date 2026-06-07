import { ref, computed, watch, watchEffect } from 'vue'

type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'todooo-theme'

const canLocalStorage = typeof localStorage !== 'undefined'
const canMatchMedia = typeof matchMedia !== 'undefined'
const canDocument = typeof document !== 'undefined'

export function useTheme() {
  const saved = canLocalStorage
    ? localStorage.getItem(STORAGE_KEY) as Theme | null
    : null
  const theme = ref<Theme>(saved ?? 'system')

  const prefersDark = ref(
    canMatchMedia
      ? matchMedia('(prefers-color-scheme: dark)').matches
      : false
  )

  if (canMatchMedia) {
    const mql = matchMedia('(prefers-color-scheme: dark)')
    mql.addEventListener('change', (e: MediaQueryListEvent) => {
      prefersDark.value = e.matches
    })
  }

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
    const order: Theme[] = ['light', 'dark', 'system']
    const idx = order.indexOf(theme.value)
    if (idx === -1) return
    theme.value = order[(idx + 1) % order.length]!
  }

  return {
    theme,
    resolvedTheme,
    toggleTheme,
  }
}
