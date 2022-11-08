import createJestConfig from 'testing/createJestConfig';
/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

/**
 * Configuration copied from
 * https://nextjs.org/docs/testing
 * */
export const jestConfig = {

  // Automatically clear mock calls, instances and results before every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,

  globalTeardown: './testing/wipeTestData.ts',

  // An array of directory names to be searched recursively up from the requiring module's location
  moduleDirectories: [
    'node_modules',
    '<rootDir>'
  ],

  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  setupFilesAfterEnv: ['./jest.setup.ts'],

  // The test environment that will be used for testing
  testEnvironment: 'jest-environment-node',

  // The glob patterns Jest uses to detect test files
  testMatch: [
    '**/lib/**/*.spec.ts',
    '**/testing/**/*.spec.ts'
  ],

  testTimeout: 30000,
  transform: {
    '^.+\\.(ts)$': 'ts-jest'
  }
};

export default createJestConfig(jestConfig);
