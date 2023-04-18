import createJestConfig from 'testing/createJestConfig';

import { jestConfig } from './jest.config';

const integrationConfig = {
  ...jestConfig,
  preset: 'ts-jest/presets/default-esm',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        babelConfig: {
          //                presets: ['@babel/preset-env'],
          caller: {
            //                  supportsTopLevelAwait: true,
            supportsStaticESM: true
          }
        },
        // tsconfig: true,
        useESM: true
      }
    ]
  },
  testEnvironment: 'jest-environment-node',
  extensionsToTreatAsEsm: ['.ts'],
  testMatch: ['**/*.spec.ts']
};

export default createJestConfig(integrationConfig);
