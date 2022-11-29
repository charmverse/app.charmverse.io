import { user } from '@guildxyz/sdk';

import log from 'lib/log';

export async function getGuildRoleIds(addresses: string[]) {
  const guildRoleIds: string[] = [];
  // Get all the guild roles associated with all of the addresses of the user
  const guildMembershipsResponses = await Promise.all(addresses.map((address) => user.getMemberships(address)));
  guildMembershipsResponses.forEach((guildMembershipsResponse) => {
    guildMembershipsResponse?.forEach((guildMemberships) => {
      if (!guildMemberships.roleids) {
        log.warn('Guild.xyz response is mossing roleids', { addresses, guildMemberships });
      } else {
        guildRoleIds.push(...guildMemberships.roleids.map(String));
      }
    });
  });
  return guildRoleIds;
}
