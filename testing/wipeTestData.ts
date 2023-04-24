import { execSync } from 'child_process';

// require('ts-node/register');

export default async function wipeTestData(): Promise<true> {
  if (process.env.NODE_ENV === 'test') {
    execSync(`dotenv -e .env.test.local -- npm run prisma:reset`);
  }

  return true;
}
