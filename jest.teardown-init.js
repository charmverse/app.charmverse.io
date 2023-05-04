import { execSync } from 'child_process';

// We were having errors with typescript and ESM execution / loading during teardown
export default async function wipeTestData() {
  if (process.env.NODE_ENV === 'test') {
    // eslint-disable-next-line no-console
    console.log('Wiping test data');
    execSync('npx dotenv -e .env.test.local -- npx tsx ./jest.teardown.ts');
  }
}
