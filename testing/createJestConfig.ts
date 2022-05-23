
import nextJest from 'next/jest';
import { join } from 'path';

const createJestConfig = nextJest({ dir: join(__dirname, '../') });

interface JestConfig {
  transformIgnorePatterns: string[];
}

// we have to use this override since next/js hard-codes node_modules in transformIgnorePatterns
export default async function overriddenConfig (_config: any) {
  return async function defaultExport () {
    const config: JestConfig = await createJestConfig(_config)();
    config.transformIgnorePatterns = ['/.next/'];
    return config;
  };
}
