import type { JestConfigWithTsJest } from 'ts-jest';

import createJestConfig from 'testing/createJestConfig';

import { jestConfig } from './jest.config';

const integrationConfig: JestConfigWithTsJest = {
  ...jestConfig,
  testEnvironment: 'jest-environment-node',
  testMatch: ['**/*.spec.ts'],
  transform: {
    ...jestConfig.transform,
    '^.+\\.(ts|js|html|svg)$': 'ts-jest'
  }
};

export default createJestConfig(integrationConfig);
