
declare module 'iron-session' {
  interface IronSessionData {
    // this data is only useful for authentication - it is not kept up-to-date!
    user: { id: string };
  }
}

export const ironOptions = {
  cookieName: 'charm.sessionId',
  password: process.env.AUTH_SECRET as string,
  // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
  cookieOptions: {
    sameSite: 'strict' as const,
    secure: typeof process.env.DOMAIN === 'string' && process.env.DOMAIN.includes('https')
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
