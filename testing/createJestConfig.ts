import * as path from 'path';

import nextJest from 'next/jest';

import { esmModules } from '../next.base';
import npmPackage from '../package.json';

const createJestConfig = nextJest({ dir: path.join(__dirname, '../') });

interface JestConfig {
  transformIgnorePatterns: string[];
  moduleNameMapper: Record<string, string>;
}

// we have to use this override since next/js hard-codes node_modules in transformIgnorePatterns
// see issue: https://github.com/vercel/next.js/issues/40183#issuecomment-1249077718
export default async function overriddenConfig(_config: any) {
  return async function defaultExport() {
    const config: JestConfig = await createJestConfig(_config)();
    // add aliases defined in package.json
    Object.assign(config.moduleNameMapper, npmPackage.imports);
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
