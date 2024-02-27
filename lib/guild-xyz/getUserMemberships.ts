import { log } from '@charmverse/core/log';

import { guild, user } from 'lib/guild-xyz/client';

export async function getUserMemberships(guildIdOrURL: string, address: string) {
  const g = await guild.get(guildIdOrURL);
  if (!g) {
    log.error(`Guild not found: ${guildIdOrURL}`);
    return false;
  }
  const memberships = await user.getMemberships(address);

  return memberships.some((membership) => membership.guildId === g.id);
}
