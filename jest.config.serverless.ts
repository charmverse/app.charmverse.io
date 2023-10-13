import createJestConfig from 'testing/createJestConfig';

import { jestConfig } from './jest.config';

const integrationConfig = {
  ...jestConfig,
  testMatch: ['**/__serverless-tests__/**/*.spec.ts']
};

export default createJestConfig(integrationConfig);
