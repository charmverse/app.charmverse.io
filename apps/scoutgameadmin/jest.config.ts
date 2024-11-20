import path from 'path';

import { compilerOptions } from './tsconfig.json';

export default {
  // Teardown function after all tests run
  globalTeardown: path.resolve(__dirname, '../../packages/scoutgame/src/testing/jest.teardown.ts'),

  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: { baseUrl: '.', paths: compilerOptions.paths }
      }
    ]
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  modulePathIgnorePatterns: ['__e2e__']
};
