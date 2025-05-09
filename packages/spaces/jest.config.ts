import * as path from 'path';

export default {
  // Teardown function after all tests run
  globalTeardown: path.resolve(__dirname, '../../jest.teardown-init.js'),

  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest'
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx']
};
