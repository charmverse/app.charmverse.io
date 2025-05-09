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
  farcasterUser: true,
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
