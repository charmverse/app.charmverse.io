import { guild } from '@guildxyz/sdk';

export async function getUserMemberships(guildUrlOrId: string | number, address: string) {
  const resp = await guild.get(guildUrlOrId);
  const memberships = await guild.getUserMemberships(resp.id, address);

  return memberships;
}
