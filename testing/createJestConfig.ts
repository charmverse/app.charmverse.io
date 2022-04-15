
import nextJest from 'next/jest';
import * as path from 'path';

const createJestConfig = nextJest({ dir: path.join(__dirname, '../') });

interface JestConfig {
  transformIgnorePatterns: string[];
}

export default async function overriddenConfig (_config: any) {
  return async function defaultExport () {
    const config: JestConfig = await createJestConfig(_config)();
    config.transformIgnorePatterns = ['/.next/'];
    return config;
  };
}
