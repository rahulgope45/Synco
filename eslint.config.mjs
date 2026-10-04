import tseslint from 'typescript-eslint';
export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/android/**', '**/ios/**', '**/.expo/**'] },
  ...tseslint.configs.recommended,
  { files: ['apps/mobile/src/ui/**/*.{ts,tsx}'], rules: {
    'no-restricted-imports': ['error', { patterns: [{ group: ['**/services/**'], message: 'UI accesses services through state/actions.' }] }]
  } },
);
