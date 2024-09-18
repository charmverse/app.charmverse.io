import 'server-only';

import type { Scout } from '@charmverse/core/prisma-client';

export async function HomePage({ user }: { user: Scout | null }) {
  return <div>Home Page!</div>;
}
