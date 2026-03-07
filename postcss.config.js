import { createRequire } from 'module';
import { existsSync } from 'fs';

// Use local deps path if available (Google Drive workaround), otherwise standard resolution
const depsPath = 'C:/dev/petapp-admin-deps/package.json';
const req = existsSync(depsPath)
  ? createRequire(`file:///${depsPath}`)
  : createRequire(import.meta.url);

const tailwindcss = req('tailwindcss');
const autoprefixer = req('autoprefixer');

export default {
  plugins: [
    tailwindcss,
    autoprefixer,
  ],
};
