import { log } from '@charmverse/core/log';
import type { LoggedInUser } from '@packages/profile/getUser';

import { mixpanelOp } from './mixpanel';

export async function updateTrackOpUserProfile(user: LoggedInUser) {
  try {
    mixpanelOp?.people.set(user.id, getTrackOpUserProfile(user));
  } catch (e) {
    log.warn(`Failed to update mixpanel profile for user id ${user.id}`);
  }
}

export function getTrackOpUserProfile(user: LoggedInUser) {
  return {
    $created: user.createdAt,
    $name: user.username,
    'Is Connected to Discord': !!user.discordUser,
    'Is Connected via Wallet': !!user.wallets.length,
    'Farcaster ID': user.farcasterUser?.fid ?? undefined
  };
}
