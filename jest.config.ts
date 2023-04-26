import type { JestConfigWithTsJest } from 'ts-jest';

import createJestConfig from 'testing/createJestConfig';
/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

/**
 * Configuration copied from
 * https://nextjs.org/docs/testing
 * */
export const jestConfig: JestConfigWithTsJest = {
  // Automatically clear mock calls, instances and results before every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,

  // An array of directory names to be searched recursively up from the requiring module's location
  moduleDirectories: ['node_modules', '<rootDir>'],

  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  setupFilesAfterEnv: ['./jest.setup.ts'],

  // Teardown function after all tests run
  globalTeardown: '<rootDir>/jest.teardown-init.js',

  // The test environment that will be used for testing
  testEnvironment: 'jest-environment-node',
  testMatch: ['**/lib/**/*.spec.ts', '**/testing/**/*.spec.ts', '**/background/**/*.spec.ts'],

  testTimeout: 30000
};

export default createJestConfig(jestConfig);
