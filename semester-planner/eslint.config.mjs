import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const config = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'],
  },
  {
    rules: {
      // App Router loads the font stylesheet once in the root layout; this
      // rule only understands the legacy pages/_document setup.
      '@next/next/no-page-custom-font': 'off',
    },
  },
];

export default config;
