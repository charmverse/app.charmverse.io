
import { authSecret as _maybeAuthSecret, baseUrl, cookieDomain } from 'config/constants';

declare module 'iron-session' {
  interface IronSessionData {
    // this data is only useful for authentication - it is not kept up-to-date!
    user: { id: string };
    // Used when we have a non signed in user
    anonymousUserId?: string;
  }
}

if (!_maybeAuthSecret) {
  throw new Error('The AUTH_SECRET env var is required to start server');
}

export const authSecret = _maybeAuthSecret;

export const ironOptions = {
  cookieName: 'charm.sessionId',
  password: authSecret,
  // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
  cookieOptions: {
    sameSite: 'strict' as const,
    secure: typeof baseUrl === 'string' && baseUrl.includes('https'),
    domain: cookieDomain
  }
};

// a map of relationships we pull in for the logged-in user (try to keep this small)
export const sessionUserRelations = {
  favorites: {
    where: {
      page: {
        deletedAt: null
      }
    },
    select: {
      pageId: true
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
  wallets: true
} as const;
