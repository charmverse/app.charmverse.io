
import * as path from 'path';

import nextJest from 'next/jest';

import { esmModules } from '../next.base';

const createJestConfig = nextJest({ dir: path.join(__dirname, '../') });

interface JestConfig {
  transformIgnorePatterns: string[];
}

// we have to use this override since next/js hard-codes node_modules in transformIgnorePatterns
export default async function overriddenConfig (_config: any) {
  return async function defaultExport () {
    const config: JestConfig = await createJestConfig(_config)();
    config.transformIgnorePatterns = [
      '/.next/',
      // ignore all node_modules except for bangle.dev
      `/node_modules/(?!(${esmModules.join('|')}))(.*)`,
      // CSS modules are mocked so they don't need to be transformed
      '^.+\\.module\\.(css|sass|scss)$'
    ];
    return config;
  };
}
