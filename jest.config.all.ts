import type { JestConfigWithTsJest } from 'ts-jest';

import createJestConfig from 'testing/createJestConfig';

import { jestConfig } from './jest.config';

const integrationConfig: JestConfigWithTsJest = {
  ...jestConfig,
  testEnvironment: 'jest-environment-node',
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    // map SVG to something that Jest can read - could be used for other extensions as well?
    // source: https://github.com/vercel/next.js/discussions/42535#discussioncomment-4828013
    '^.+\\.(svg)$': require.resolve('./testing/fileMock.js')
  }
};

export default createJestConfig(integrationConfig);
