// a map of relationships we pull in for the logged-in user (try to keep this small)
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
