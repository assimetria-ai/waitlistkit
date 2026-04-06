import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import babelParser from '@babel/eslint-parser';
import { createRequire } from 'module';

// Load local rule without a published package
const require = createRequire(import.meta.url);
const noUndefinedLucideIcons = require('./eslint-rules/no-undefined-lucide-icons.js');

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      // Use @babel/eslint-parser so TypeScript syntax in .js files
      // (e.g. `export type { ... }` in the icons barrel) is parsed correctly.
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: [
            ['@babel/preset-env', { targets: 'defaults', modules: false }],
            ['@babel/preset-react', { runtime: 'automatic' }],
            '@babel/preset-typescript',
          ],
        },
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      // Inline local plugin — no npm publish needed
      local: {
        rules: {
          'no-undefined-lucide-icons': noUndefinedLucideIcons,
        },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Catches typos / renamed icons before they reach production — refs #19642 #19633
      'local/no-undefined-lucide-icons': 'error',
    },
  },
];
