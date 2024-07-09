import type { FarcasterUser, User } from '@charmverse/core/prisma';

export interface LoggedInUser extends User {
  farcasterUser?: FarcasterUser | null;
}
