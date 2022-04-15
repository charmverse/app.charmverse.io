import createJestConfig from 'testing/createJestConfig';

import { jestConfig } from './jest.config-server';

const integrationConfig = {
  ...jestConfig,
  testMatch: [
    '**/__integration-tests__/server/**/?(*.)+(spec|test).[tj]s?(x)'
  ]
};

export default createJestConfig(integrationConfig);
