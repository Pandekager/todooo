<template>
  <div class="min-h-screen bg-white dark:bg-#1a1a1a text-#333 dark:text-#ccc font-sans transition-colors">
    <main class="max-w-2xl mx-auto px-4 py-12">
      <div class="flex items-center justify-center mb-8 gap-4">
        <h1 class="text-2xl font-bold">Todooo</h1>
        <button
          class="align-middle opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
          :title="themeTitle"
          @click="toggleTheme"
        >
          <svg v-if="theme === 'light'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
          <svg v-else-if="theme === 'dark'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </button>
      </div>
      <p class="text-center text-lg text-#888 dark:text-#999 mt-16">
        Ingen ting på listen — ingen problemer :)
      </p>
    </main>
  </div>
</template>

<script setup lang="ts">
const { theme, toggleTheme } = useTheme()

const themeTitle = computed(() => {
  switch (theme.value) {
    case 'light': return 'Skift til mørk tilstand'
    case 'dark': return 'Skift til systemtilstand'
    case 'system': return 'Skift til lys tilstand'
  }
})
</script>
