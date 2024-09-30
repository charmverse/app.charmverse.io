import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getSession } from '@connect-shared/lib/session/getSession';
import { getFarcasterUserById } from '@packages/farcaster/getFarcasterUserById';
import type { NextRequest } from 'next/server';

// This API Route is non-blocking and called on every page load. Use it to refresh things about the current user
export async function GET(req: NextRequest) {
  const session = await getSession();
  const userId = session.scoutId;
  if (userId) {
    const scout = await prisma.scout.findUnique({
      where: {
        id: userId
      }
    });
    if (!scout) {
      log.info('Delete session for unknown user', { userId });
      session.destroy();
      await session.save();
    } else if (scout.farcasterId) {
      const profile = await getFarcasterUserById(scout.farcasterId).catch((error) => {
        log.error('Error fetching Farcaster profile when refreshing session', { error, userId });
        return null;
      });
      if (profile) {
        const bio = profile.profile.bio.text;
        const displayName = profile.display_name || profile.username;
        const username = profile.username;

        const hasProfileChanged =
          // Re-enable this once Neynar fixes their caching mechanism
          // scout.avatar !== profile.body.avatarUrl ||
          scout.bio !== bio || scout.displayName !== displayName || scout.username !== username;

        if (hasProfileChanged) {
          await prisma.scout.update({
            where: {
              id: userId
            },
            data: {
              // Re-enable this once Neynar fixes their caching mechanism
              // avatar: profile.body.avatarUrl,
              bio,
              displayName,
              username
            }
          });
          log.info('Updated Farcaster profile', { userId, profile });
        }
      }
    }
  }

  return new Response('ok');
}
