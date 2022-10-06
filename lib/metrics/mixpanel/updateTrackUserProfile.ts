
import type { Space } from '@prisma/client';

import { prisma } from 'db';
import log from 'lib/log';
import { mixpanel } from 'lib/metrics/mixpanel/mixpanel';
import type { LoggedInUser } from 'models';

export async function updateTrackUserProfile (user: LoggedInUser) {
  const spaceIds = user.spaceRoles.map(sr => sr.spaceId);
  const userSpaces = await prisma.space.findMany({ where: { id: { in: spaceIds } } });

  try {
    mixpanel?.people.set(user.id, getTrackUserProfile(user, userSpaces));
  }
  catch (e) {
    log.warn(`Failed to update mixpanel profile for user id ${user.id}`);
  }
}

export function getTrackUserProfile (user: LoggedInUser, userSpaces: Space[]) {
  return {
    $created: user.createdAt,
    $name: user.username,
    'User Updated At': user.updatedAt,
    'Is Connected to Discord': !!user.discordUser,
    'Is Connected via Wallet': !!user.wallets.length,
    'Workspaces Joined': userSpaces.map(s => s.name),
    // Needed for grouping events in user profile
    'Space Id': userSpaces.map(s => s.id)
  };
}
