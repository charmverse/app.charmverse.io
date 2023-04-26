import type { JestConfigWithTsJest } from 'ts-jest';

import createJestConfig from 'testing/createJestConfig';

import { jestConfig } from './jest.config';

const integrationConfig: JestConfigWithTsJest = {
  ...jestConfig,
  testEnvironment: 'jest-environment-node',
  testMatch: ['**/*.spec.ts']
};

export default createJestConfig(integrationConfig);
