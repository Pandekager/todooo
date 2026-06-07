export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@unocss/nuxt'],
  css: ['@unocss/reset/tailwind.css'],
  app: {
    head: {
      title: 'Todooo',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },
})
