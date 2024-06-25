export const cookieName = 'charm.sessionId';
export const baseUrl = process.env.DOMAIN as string | undefined;
export const authSecret = process.env.AUTH_SECRET as string | undefined;

export const sessionUserRelations = {
  farcasterUser: true,
  wallets: {
    select: {
      address: true,
      ensname: true,
      id: true
    }
  }
} as const;
