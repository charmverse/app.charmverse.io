import { prisma } from '@charmverse/core';
import type { Prisma, Space } from '@charmverse/core/dist/prisma';

import log from 'lib/log';
import type { LoggedInUser } from 'models';

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
