import createJestConfig from '@packages/testing/createJestConfig';

import { jestConfig } from './jest.config.nodejs';

const integrationConfig = {
  ...jestConfig,
  testMatch: [
    '**/__integration-tests__/server/pages/api/forums/**/*.spec.ts',
    '**/lib/forums/**/*.spec.ts',
    '**/__integration-tests__/server/pages/api/spaces/[id]/post-categories/**/*.spec.ts'
  ]
};

export default createJestConfig(integrationConfig);
