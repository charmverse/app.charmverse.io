import type { JestConfigWithTsJest } from 'ts-jest';

import defaultJestConfig from './jest.config';

const serverJestConfig: JestConfigWithTsJest = {
  ...defaultJestConfig,
  testMatch: ['**/__tests__/**/*.spec.ts']
};

export default serverJestConfig;
