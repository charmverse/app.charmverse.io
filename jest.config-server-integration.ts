import createJestConfig from 'testing/createJestConfig';

import { jestConfig } from './jest.config-server';

const integrationConfig = {
  ...jestConfig,
  testMatch: [
    '**/__integration-tests__/server/pages/api/spaces/[id]/set-default-page-permissions.spec.ts'
  ]
};

export default createJestConfig(integrationConfig);
