module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
    'plugin:react/jsx-runtime',
    'plugin:node/recommended',
    'plugin:prettier/recommended',
  ],
  overrides: [
    {
      env: {
        node: true,
      },
      files: [
        '.eslintrc.{js,cjs}',
        '**/__tests__/**/*.[jt]s?(x)',
        ',**/?(*.)+(spec|test).[jt]s?(x)',
      ],
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
  settings: {
    react: {
      version: 'detect',
    },
    node: {
      resolvePaths: [__dirname],
      tryExtensions: ['.ts', '.tsx', '.js', '.json', '.node'],
    },
    'import/resolver': {
      typescript: {},
    },
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    'react',
    '@typescript-eslint',
    'import',
    'jsx-a11y',
    'react-hooks',
    'prettier',
    'node',
  ],
  rules: {
    'node/no-missing-import': 'off',
    'import/no-unresolved': 'error',
    'jsx-a11y/no-autofocus': 'warn',
    'react/prop-types': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'node/no-unsupported-features/es-syntax': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'node/no-unpublished-import': 'off',
    'node/no-unsupported-features/es-builtins': [
      'error',
      { version: '>=11.0.0' },
    ],
    'node/no-unsupported-features/node-builtins': [
      'error',
      { version: '>=11.0.0' },
    ],
    'prettier/prettier': [
      'warn',
      {
        endOfLine: 'auto',
      },
    ],
    'no-console': 'warn',
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', ['parent', 'sibling']],
        pathGroups: [
          {
            pattern: 'react',
            group: 'external',
            position: 'before',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
  },
}
