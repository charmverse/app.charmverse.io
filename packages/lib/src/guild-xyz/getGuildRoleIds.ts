import { log } from '@charmverse/core/log';
import { user } from '@packages/lib/guild-xyz/client';

export async function getGuildRoleIds(addresses: string[]) {
  const guildRoleIds: string[] = [];
  // Get all the guild roles associated with all of the addresses of the user
  const guildMembershipsResponses = await Promise.all(addresses.map((address) => user.getMemberships(address)));
  guildMembershipsResponses.forEach((guildMembershipsResponse) => {
    guildMembershipsResponse?.forEach((guildMemberships) => {
      const { roleIds, roleids } = guildMemberships as unknown as { roleids: string[]; roleIds: string[] };
      if (roleIds) {
        guildRoleIds.push(...roleIds.map(String));
      } else if (roleids) {
        guildRoleIds.push(...roleids.map(String));
      } else {
        log.warn('Guild.xyz response is missing roleIds', { addresses, guildMemberships });
      }
    });
  });
  return guildRoleIds;
}
