import type { FarcasterUser, User, UserWallet } from '@charmverse/core/prisma-client';

export type LoggedInUser = User & {
  farcasterUser?: Omit<FarcasterUser, 'userId'> | null;
  wallets?: Omit<UserWallet, 'userId'>[] | null;
};
