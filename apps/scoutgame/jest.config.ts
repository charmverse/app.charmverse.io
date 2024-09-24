import { pathsToModuleNameMapper } from 'ts-jest';

import { compilerOptions } from './tsconfig.json';

export default {
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest'
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  modulePathIgnorePatterns: ['__e2e__'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' })
};
