import { authSecret as _maybeAuthSecret, isTestEnv, baseUrl, cookieName } from 'config/constants';
import 'iron-session';

declare module 'iron-session' {
  interface IronSessionData {
    // this data is only useful for authentication - it is not kept up-to-date!
    user: { id: string };
    // Used when we have a non signed in user
    anonymousUserId?: string;
    // Used when logged is as a different user
    isRemote?: boolean;
  }
}

if (!_maybeAuthSecret && !isTestEnv) {
  throw new Error('The AUTH_SECRET env var is required to start server');
}

export const authSecret = _maybeAuthSecret as string;

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
  unstoppableDomains: {
    select: {
      domain: true
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
