import type { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  preset: 'ts-jest/presets/default-esm', // Ensure you use the ESM preset
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.json', // Ensure this points to your tsconfig file
        // useESM: true,
        babelConfig: {
          caller: {
            supportsStaticESM: true
          }
        }
      }
    ]
  },
  moduleNameMapper: {
    '^lib/(.*)$': '<rootDir>/../../lib/$1', // Adjust this according to your project structure
    '^@connect-api/(.*)$': '<rootDir>/src/$1'
  },
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'jest-environment-node', // Change to node environment for simplicity
  moduleDirectories: ['node_modules', 'src'],
  testTimeout: 30000,
  testMatch: ['**/*.spec.ts']
};

export default jestConfig;
