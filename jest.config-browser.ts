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

  // An array of directory names to be searched recursively up from the requiring module's location
  moduleDirectories: ['node_modules', '<rootDir>'],

  // The test environment that will be used for testing
  testEnvironment: 'jsdom',

  // The glob patterns Jest uses to detect test files
  testMatch: ['**/components/**/?(*.)+(spec).[tj]s?(x)', '**/hooks/**/*.spec.ts'],
  modulePathIgnorePatterns: ['focalboard/src'],
  testTimeout: 30000,
  moduleNameMapper: {
    // map SVG to something that Jest can read - could be used for other extensions as well?
    // source: https://github.com/vercel/next.js/discussions/42535#discussioncomment-4828013
    '^.+\\.(svg)$': require.resolve('./testing/fileMock.js')
  }
};

export default createJestConfig(jestConfig);
