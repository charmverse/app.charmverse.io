
import { prisma } from 'db';
import log from 'lib/log';
import { mixpanel } from 'lib/metrics/mixpanel/mixpanel';
import type { LoggedInUser } from 'models';

export async function updateTrackUserProfile (user: LoggedInUser) {
  const spaceIds = user.spaceRoles.map(sr => sr.spaceId);
  const userSpaces = await prisma.space.findMany({ where: { id: { in: spaceIds } } });

  const profile = {
    $created: user.createdAt,
    $name: user.username,
    'Is Connected to Discord': !!user.discordUser,
    'Is Connected via Wallet': !!user.wallets.length,
    'Workspaces Joined': userSpaces.map(s => s.name),
    // Needed for grouping events in user profile
    'Space Id': spaceIds
  };

  try {
    mixpanel?.people.set(user.id, profile);
  }
  catch (e) {
    log.warn(`Failed to update mixpanel profile for user id ${user.id}`);
  }
}
