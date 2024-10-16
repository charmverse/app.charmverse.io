import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getFarcasterUserById } from '@packages/farcaster/getFarcasterUserById';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) {
    return new Response('userId is required', { status: 400 });
  }
  const user = await prisma.scout.findUniqueOrThrow({
    where: {
      id: userId
    },
    select: {
      farcasterId: true
    }
  });
  if (!user.farcasterId) {
    log.warn('User has no Farcaster ID', { userId });
    return Response.json(null);
  }
  const profile = await getFarcasterUserById(user.farcasterId).catch((error) => {
    log.error('Error fetching Farcaster profile', { error, userId });
    return null;
  });

  return Response.json(profile);
}
