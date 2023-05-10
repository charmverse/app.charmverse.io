import * as path from 'path';

import nextJest from 'next/jest';

const createJestConfig = nextJest({ dir: path.join(__dirname, '../') });

export default async function overriddenConfig(_config: any) {
  return createJestConfig(_config);
}
