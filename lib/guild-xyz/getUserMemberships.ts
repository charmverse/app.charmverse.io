import { guild, user } from 'lib/guild-xyz/client';

export async function getUserMemberships(address: string) {
  const memberships = await user.getMemberships(address);

  return memberships;
}
