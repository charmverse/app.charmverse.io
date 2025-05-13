export default {
  // Teardown function after all tests run
  // globalTeardown: '<rootDir>/jest.teardown-init.js',
  transform: {
    '^.+.(t|j)sx?$': '@swc/jest'
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx']
};
