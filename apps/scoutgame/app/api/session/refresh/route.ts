import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getSession } from '@connect-shared/lib/session/getSession';
import { getFarcasterUserById } from '@packages/farcaster/getFarcasterUserById';
import type { NextRequest } from 'next/server';

// This API Route is non-blocking and called on every page load. Use it to refresh things about the current user
export async function GET(req: NextRequest) {
  const session = await getSession();

  // save session to update the LAX cookie
  await session.save();

  const userId = session.scoutId;
  if (userId) {
    const scout = await prisma.scout.findUnique({
      where: {
        id: userId
      },
      select: {
        bio: true,
        farcasterName: true,
        path: true,
        farcasterId: true
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
        const username = profile.username;

        const hasProfileChanged =
          // Re-enable this once Neynar fixes their caching mechanism
          // scout.avatar !== profile.body.avatarUrl ||
          scout.bio !== bio || scout.farcasterName !== username;

        if (hasProfileChanged) {
          await prisma.scout.update({
            where: {
              id: userId
            },
            data: {
              bio,
              farcasterName: username
            }
          });
          log.info('Updated Farcaster profile', { userId, profile });
        }
      }
    }
  }

  return new Response('ok');
}
