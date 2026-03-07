import { createRequire } from 'module';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use local deps path if available (Google Drive workaround), otherwise standard resolution
const depsPath = 'C:/dev/petapp-admin-deps/package.json';
const req = existsSync(depsPath)
  ? createRequire(`file:///${depsPath}`)
  : createRequire(import.meta.url);

const tailwindcss = req('tailwindcss');
const autoprefixer = req('autoprefixer');

export default {
  plugins: [
    tailwindcss({ config: resolve(__dirname, 'tailwind.config.js') }),
    autoprefixer,
  ],
};
