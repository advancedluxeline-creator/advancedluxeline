import { defineConfig } from 'vite'

// IMPORTANT: Change 'crystal-view' to whatever you name your GitHub repository
// e.g. if your repo is github.com/john/my-guesthouse → base: '/my-guesthouse/'
export default defineConfig({
  base: '/crystal-view/',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin.html',
      },
    },
  },
})
