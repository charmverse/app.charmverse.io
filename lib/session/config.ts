import type { IdentityType } from '@charmverse/core/prisma-client';

import 'iron-session';

declare module 'iron-session' {
  interface IronSessionData {
    // this data is only useful for authentication - it is not kept up-to-date!
    user: { id: string };
    // Used when we have a non signed in user
    anonymousUserId?: string;
    // Used when logged is as a different user
    isRemote?: boolean;
    // Used when not logged in and waiting for OTP to be validated
    otpUser?: { id: string; method: IdentityType };
  }
}

// a map of relationships we pull in for the logged-in user (try to keep this small)
export const sessionUserRelations = {
  favorites: {
    where: {
      page: {
        deletedAt: null
      }
    },
    select: {
      pageId: true,
      index: true
    }
  },
  spaceRoles: {
    include: {
      spaceRoleToRole: {
        include: {
          role: true
        }
      }
    }
  },
  discordUser: true,
  telegramUser: true,
  notificationState: true,
  verifiedEmails: {
    select: {
      email: true,
      name: true
    }
  },
  wallets: {
    select: {
      address: true,
      ensname: true,
      id: true
    }
  },
  otp: {
    select: {
      activatedAt: true
    }
  },
  googleAccounts: {
    select: {
      email: true,
      name: true
    }
  },
  profile: {
    select: {
      timezone: true,
      locale: true
    }
  }
} as const;
