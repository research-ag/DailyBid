import { type JestConfigWithTsJest, pathsToModuleNameMapper } from 'ts-jest'

import { compilerOptions } from './tsconfig.json'

const config: JestConfigWithTsJest = {
  watch: false,
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'jsdom',
  testTimeout: 10000,
  transform: {
    '^.+\\.(ts|tsx|js|jsx|mjs)$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.jest.json',
        useESM: false,
      },
    ],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(?:@icp-sdk|@research-ag/ckbtc-address-js|@dfinity/utils)(?:/|$))',
  ],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths, {
      prefix: '<rootDir>',
    }),
    // Force CommonJS builds for ESM-only packages so Jest can load them without transforming ESM
    '^@icp-sdk/core/principal$':
      '<rootDir>/node_modules/@icp-sdk/core/lib/cjs/principal/index.js',
    '^@icp-sdk/canisters/ledger/icp$':
      '<rootDir>/node_modules/@icp-sdk/canisters/ledger/icp/index.js',
    '^@icp-sdk/canisters/ledger/icrc$':
      '<rootDir>/node_modules/@icp-sdk/canisters/ledger/icrc/index.js',
    '^@dfinity/utils$': '<rootDir>/node_modules/@dfinity/utils/dist/index.js',
    '^.+\\.png$': '<rootDir>/__mocks__/fileMock.ts',
    '^bymax-react-select$': '<rootDir>/__mocks__/bymaxReactSelectMock.tsx',
    '^react-i18next$': '<rootDir>/__mocks__/react-i18next.ts',
  },
  setupFilesAfterEnv: [
    'jest-localstorage-mock',
    '@testing-library/jest-dom',
    '<rootDir>/jest.setup.ts',
  ],
}

export default config
