import type { JestConfigWithTsJest } from 'ts-jest';
import { createDefaultEsmPreset } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  ...createDefaultEsmPreset(),
  preset: 'ts-jest/presets/default-esm',
  moduleNameMapper: {
    '^@packages/scoutgame/(.*)$': '<rootDir>/../../packages/scoutgame/src/$1'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true
      }
    ]
  },
  extensionsToTreatAsEsm: ['.ts']
};

export default jestConfig;
