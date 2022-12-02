import { authSecret as _maybeAuthSecret, isTestEnv, baseUrl, cookieName } from 'config/constants';

declare module 'iron-session' {
  interface IronSessionData {
    // this data is only useful for authentication - it is not kept up-to-date!
    user: { id: string };
    // Used when we have a non signed in user
    anonymousUserId?: string;
  }
}

if (!_maybeAuthSecret && !isTestEnv) {
  throw new Error('The AUTH_SECRET env var is required to start server');
}

export const authSecret = _maybeAuthSecret as string;

export const ironOptions = {
  cookieName,
  password: authSecret,
  cookieOptions: {
    sameSite: 'strict' as const,
    // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
    secure: typeof baseUrl === 'string' && baseUrl.includes('https')
    // domain: cookieDomain TODO: change domain to subdomain without logging people out, so we can use them across subdomains
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
  wallets: true,
  unstoppableDomains: {
    select: {
      domain: true
    }
  }
} as const;
