import 'server-only';

import type { Scout } from '@charmverse/core/prisma-client';

export async function BuilderTab({ user }: { user: Scout }) {
  return (
    <div>
      <h1>Builder</h1>
      <p>Builder tab for {user.username}</p>
    </div>
  );
}
