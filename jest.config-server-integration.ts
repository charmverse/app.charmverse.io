import nextJest from 'next/jest';

import { jestConfig } from './jest.config-server';

const createJestConfig = nextJest({ dir: __dirname });

const integrationConfig = {
  ...jestConfig,
  testMatch: [
    '**/__integration-tests__/server/**/?(*.)+(spec|test).[tj]s?(x)'
  ]
};

export default createJestConfig(integrationConfig);
