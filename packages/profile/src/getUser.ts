import type {
  Prisma,
  DiscordUser,
  FarcasterUser,
  GoogleAccount,
  Role as RoleMembership,
  SpaceRole,
  SpaceRoleToRole,
  TelegramUser,
  User,
  UserNotificationState,
  UserWallet,
  VerifiedEmail
} from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError, MissingDataError } from '@packages/utils/errors';

import { sessionUserRelations } from './constants';

interface NestedMemberships {
  spaceRoleToRole: (SpaceRoleToRole & { role: RoleMembership })[];
}

export interface LoggedInUser extends User {
  favorites: { pageId: string; index?: number }[];
  spaceRoles: (SpaceRole & NestedMemberships)[];
  wallets: Pick<UserWallet, 'address' | 'ensname' | 'id'>[];
  googleAccounts: Pick<GoogleAccount, 'email' | 'name'>[];
  verifiedEmails: Pick<VerifiedEmail, 'email' | 'name'>[];
  ensName?: string;
  discordUser?: DiscordUser | null;
  telegramUser?: TelegramUser | null;
  farcasterUser?: FarcasterUser | null;
  notificationState?: UserNotificationState | null;
  isNew?: boolean;
  otp?: {
    activatedAt: Date | null;
  } | null;
  profile?: {
    timezone?: string | null;
    locale?: string | null;
  } | null;
}

export async function getUserProfile(
  key: 'id' | 'addresses',
  value: string,
  tx: Prisma.TransactionClient = prisma
): Promise<LoggedInUser> {
  const query: Prisma.UserWhereInput = {};

  if (!value) {
    throw {
      error: 'Invalid query'
    };
  }

  if (key === 'addresses') {
    query.wallets = {
      some: {
        address: value.toLowerCase()
      }
    };
  } else {
    query.id = value;
  }

  const profile = await tx.user.findFirst({
    where: query,
    include: sessionUserRelations
  });

  if (!profile) {
    throw new MissingDataError(`User with ${key} ${value} not found`);
  }

  return profile;
}

export function userByEmailOrGoogleAccountQuery(emails: string | string[]) {
  if (!emails) {
    throw new InvalidInputError('Emails are required');
  }

  if (emails instanceof Array === false) {
    emails = [emails];
  }

  const cleanEmails = emails.map((email) => email.trim().toLowerCase());

  return {
    OR: [
      {
        verifiedEmails: {
          some: {
            email: {
              in: cleanEmails
            }
          }
        }
      },
      {
        googleAccounts: {
          some: {
            email: {
              in: cleanEmails
            }
          }
        }
      }
    ]
  };
}
