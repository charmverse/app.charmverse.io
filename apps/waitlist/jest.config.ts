import { compilerOptions } from './tsconfig.json';

export default {
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
