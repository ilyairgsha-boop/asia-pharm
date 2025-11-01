import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: [
      'sonner', 
      'react-hook-form',
      'react',
      'react-dom',
      'lucide-react',
      'date-fns',
      'recharts',
    ],
    exclude: [],
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Отключаем sourcemap для production
    target: 'es2015', // Совместимость с большинством браузеров
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      external: [
        /supabase\/functions\/.*/,
      ],
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'ui-vendor': ['lucide-react', 'recharts'],
          'radix-ui': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
          ],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
