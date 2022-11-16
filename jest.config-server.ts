import createJestConfig from 'testing/createJestConfig';

import { jestConfig } from './jest.config';

const integrationConfig = {
  ...jestConfig,
  testMatch: [
    '**/__integration-tests__/**/*.spec.ts'
    // '**/lib/**/*.spec.ts'
  ]
};

export default createJestConfig(integrationConfig);
