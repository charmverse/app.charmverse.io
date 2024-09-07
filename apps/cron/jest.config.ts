import { pathsToModuleNameMapper } from 'ts-jest';

import makeConfig from '../../jest.config.nodejs';

import { compilerOptions } from './tsconfig.json';

export default {
  // ...makeConfig(__dirname),
  preset: 'ts-jest',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest'
  },

  roots: ['<rootDir>'],
  // baseUrl: '.',
  modulePaths: ['<rootDir>'], // <-- This will be set to 'baseUrl' value
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }) // <-- This will be set to 'paths' value
  // testMatch: ['<rootDir>/src/**/*.spec.ts']
};
