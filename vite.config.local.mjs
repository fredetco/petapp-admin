// Local dev config — resolves plugins and deps from external directory
import { createRequire } from 'module';
import path from 'path';

const require = createRequire('file:///C:/dev/petapp-admin-deps/package.json');
const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');

const ext = 'C:/dev/petapp-admin-deps/node_modules';

// Map every dependency to its location in the external node_modules
const deps = [
  'react',
  'react-dom',
  'react-router-dom',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'react-dom/client',
  '@supabase/supabase-js',
  '@tanstack/react-query',
  '@tanstack/react-table',
  '@monaco-editor/react',
  'recharts',
  'lucide-react',
  'date-fns',
];

const alias = deps.map((dep) => ({
  find: dep,
  replacement: path.resolve(ext, dep),
}));

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    host: true,
  },
  resolve: {
    alias,
  },
  optimizeDeps: {
    esbuildOptions: {
      nodePaths: [ext],
    },
  },
  css: {
    postcss: path.resolve('G:/My Drive/_CLAUDE/PET-ADMIN/postcss.config.js'),
  },
});
