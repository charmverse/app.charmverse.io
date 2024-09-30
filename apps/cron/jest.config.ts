import { compilerOptions } from './tsconfig.json';

export default {
  // Teardown function after all tests run
  globalTeardown: '<rootDir>/jest.teardown-init.js',
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: { baseUrl: '.', paths: compilerOptions.paths }
      }
    ]
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx']
};
