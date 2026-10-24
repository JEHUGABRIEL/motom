import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        // Sans regroupement, chaque icône et chaque module partagé devient un
        // micro-chunk (60+ fichiers JS). On consolide les dépendances externes :
        // - icons : lucide-react
        // - vendor : le reste de node_modules (react, router, i18n, query…)
        // Les pages restent découpées par route (lazy loading).
        codeSplitting: {
          groups: [
            { name: 'icons', test: /[\\/]node_modules[\\/]lucide-react[\\/]/ },
            { name: 'vendor', test: /[\\/]node_modules[\\/]/ },
          ],
        },
      },
    },
  },
})
