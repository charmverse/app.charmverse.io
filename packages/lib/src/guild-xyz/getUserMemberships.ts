import { user } from '@packages/lib/guild-xyz/client';

export async function getUserMemberships(guildId: string | number, address: string) {
  const memberships = await user.getMemberships(address).catch(() => null);

  return !!memberships?.some((membership) => membership.guildId === Number(guildId));
}
