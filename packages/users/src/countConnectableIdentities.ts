import type { LoggedInUser } from '@packages/profile/getUser';

export function countConnectableIdentities(user: LoggedInUser): number {
  let count = 0;

  count += user.wallets.length;
  if (user.discordUser) {
    count += 1;
  }

  count += user.googleAccounts.length;

  count += user.verifiedEmails.length;

  return count;
}
