import createJestConfig from 'testing/createJestConfig';

import { jestConfig } from './jest.config';

const integrationConfig = {
  ...jestConfig,
  testMatch: ['**/*.spec.ts']
};

export default createJestConfig(integrationConfig);
