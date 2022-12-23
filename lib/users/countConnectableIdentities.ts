import type { LoggedInUser } from 'models';

export function countConnectableIdentities(user: LoggedInUser): number {
  let count = 0;

  count += user.wallets.length;
  if (user.discordUser) {
    count += 1;
  }

  count += user.unstoppableDomains.length;

  count += user.googleAccounts.length;

  return count;
}
