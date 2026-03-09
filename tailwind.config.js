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
        display: ['Lexend', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Primary — Amber (admin authority)
        primary: {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },
        // Slate neutrals (Salient)
        neutral: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        // Sidebar
        sidebar: {
          DEFAULT: '#0F172A',
          hover: '#1E293B',
          active: '#334155',
          text: '#E2E8F0',
          muted: '#94A3B8',
        },
        // Legacy admin.* aliases (backward compat during migration)
        admin: {
          sidebar: '#0F172A',
          'sidebar-hover': '#1E293B',
          'sidebar-active': '#334155',
          'sidebar-text': '#E2E8F0',
          'sidebar-muted': '#94A3B8',
          accent: { 400: '#FBBF24', 500: '#F59E0B', 600: '#D97706' },
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
        '3xl': '24px',
        '2xl': '16px',
        xl: '12px',
      },
      boxShadow: {
        lg: '0 10px 15px -3px rgb(15 23 42 / 0.08), 0 4px 6px -4px rgb(15 23 42 / 0.04)',
        xl: '0 20px 25px -5px rgb(15 23 42 / 0.1), 0 8px 10px -6px rgb(15 23 42 / 0.04)',
      },
    },
  },
  plugins: [forms],
};
