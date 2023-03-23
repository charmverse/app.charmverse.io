import { v4 as uuid } from 'uuid';

import type { LoggedInUser } from 'models';

export function createMockUser(user?: Partial<LoggedInUser>): LoggedInUser {
  return {
    id: uuid(),
    avatar: null,
    avatarChain: null,
    avatarContract: null,
    avatarTokenId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    isBot: false,
    email: 'user@charmverse.io',
    emailNewsletter: false,
    emailNotifications: false,
    identityType: 'Wallet',
    username: uuid(),
    path: uuid(),
    spacesOrder: [],
    xpsEngineId: null,
    wallets: [
      {
        ensname: null,
        address: '0x0000000000000000000000000000000000000000'
      }
    ],
    spaceRoles: [],
    unstoppableDomains: [],
    favorites: [],
    googleAccounts: [],
    verifiedEmails: [],
    ...user
  };
}
