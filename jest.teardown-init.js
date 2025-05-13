/* eslint-disable no-console */
import { execSync } from 'child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async function wipeTestData() {
  if (process.env.NODE_ENV === 'test') {
    try {
      console.log('debug: Wiping test data');
      const res = await execSync('npx dotenv -e .env.test.local -- npx tsx ./jest.teardown.ts', { cwd: __dirname });
      console.log(res.toString());
    } catch (error) {
      console.error('Error while running teardown:', error);
    }
  }
}
