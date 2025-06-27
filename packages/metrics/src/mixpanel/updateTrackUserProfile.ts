import type { Prisma, Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { log } from '@packages/core/log';
import type { LoggedInUser } from '@packages/profile/getUser';

import { mixpanel } from './mixpanel';

export async function updateTrackUserProfile(user: LoggedInUser, tx: Prisma.TransactionClient = prisma) {
  const spaceIds = user.spaceRoles.map((sr) => sr.spaceId);
  const userSpaces = await tx.space.findMany({ where: { id: { in: spaceIds } } });

  try {
    mixpanel?.people.set(user.id, getTrackUserProfile(user, userSpaces));
  } catch (e) {
    log.warn(`Failed to update mixpanel profile for user id ${user.id}`);
  }
}

export function getTrackUserProfile(user: LoggedInUser, userSpaces: Space[]) {
  return {
    $created: user.createdAt,
    $name: user.username,
    'User Updated At': user.updatedAt,
    'Is Connected to Discord': !!user.discordUser,
    'Is Connected via Wallet': !!user.wallets.length,
    'Workspaces Joined': userSpaces.map((s) => s.name),
    // Needed for grouping events in user profile
    'Space Id': userSpaces.map((s) => s.id)
  };
}
