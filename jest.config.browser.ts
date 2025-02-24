import nextJest from 'next/jest';

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
const jestConfig = {
  // Automatically clear mock calls, instances and results before every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,

  // An array of directory names to be searched recursively up from the requiring module's location
  moduleDirectories: ['node_modules', '<rootDir>'],

  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  setupFilesAfterEnv: ['<rootDir>/jest.setup.browser.ts'],

  // The test environment that will be used for testing
  testEnvironment: 'jsdom',

  moduleNameMapper: {
    // map SVG to something that Jest can read - could be used for other extensions as well?
    // source: https://github.com/vercel/next.js/discussions/42535#discussioncomment-4828013
    '^.+\\.(svg)$': require.resolve('@packages/testing/fileMock.js')
  }
};

export default function makeConfig(testDir: string) {
  return createJestConfig({
    ...jestConfig,
    rootDir: __dirname,
    testMatch: [`${testDir}/**/*.spec.ts?(x)`]
  });
}
