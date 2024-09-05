import nextJest from 'next/jest';
import type { JestConfigWithTsJest } from 'ts-jest';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './'
});

/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

/**
 * Configuration copied from
 * https://nextjs.org/docs/testing
 * */
export const jestConfig: Omit<JestConfigWithTsJest, 'transform'> = {
  // Automatically clear mock calls, instances and results before every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,

  modulePathIgnorePatterns: ['__e2e__'],

  // An array of directory names to be searched recursively up from the requiring module's location
  moduleDirectories: ['node_modules', '<rootDir>'],

  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  setupFilesAfterEnv: ['./jest.setup.ts'],

  // Teardown function after all tests run
  globalTeardown: '<rootDir>/jest.teardown-init.js',

  // The test environment that will be used for testing
  testEnvironment: 'jest-environment-node',

  // This is needed so CI environment does not attempt to run tests in the permissions_api folder
  testPathIgnorePatterns: ['<rootDir>/permissions_api'],

  testTimeout: 240000

  // roots: ['<rootDir>', './testing/jest/']
};

export default function makeConfig(testDir: string) {
  return createJestConfig({
    ...jestConfig,
    rootDir: __dirname,
    testMatch: [`${testDir}/**/*.spec.ts`]
  });
}
