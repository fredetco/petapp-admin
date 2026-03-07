import { createRequire } from 'module';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Resolve paths relative to this config file (works from any working directory)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use local deps path if available (Google Drive workaround), otherwise standard resolution
const depsPath = 'C:/dev/petapp-admin-deps/package.json';
const req = existsSync(depsPath)
  ? createRequire(`file:///${depsPath}`)
  : createRequire(import.meta.url);

const forms = req('@tailwindcss/forms');

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    resolve(__dirname, './index.html'),
    resolve(__dirname, './src/**/*.{js,ts,jsx,tsx}'),
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        admin: {
          // Primary — Slate (authoritative / technical)
          sidebar: '#0F172A',
          'sidebar-hover': '#1E293B',
          'sidebar-active': '#334155',
          'sidebar-text': '#E2E8F0',
          'sidebar-muted': '#94A3B8',
          // Accent — Amber (admin authority)
          accent: {
            400: '#FBBF24',
            500: '#F59E0B',
            600: '#D97706',
          },
          // Surfaces
          bg: '#F8FAFC',
          surface: '#FFFFFF',
          border: '#E2E8F0',
        },
        // Status
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
      },
      borderRadius: {
        '2xl': '16px',
        xl: '12px',
      },
    },
  },
  plugins: [forms],
};
