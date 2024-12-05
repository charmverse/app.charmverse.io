import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { refreshShareImage } from '@packages/scoutgame/builders/refreshShareImage';
import { currentSeason } from '@packages/scoutgame/dates';

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('builderId');

  if (typeof search !== 'string' || !search) {
    return new Response('builderId is not defined', { status: 400 });
  }

  try {
    const existingNft = await prisma.builderNft.findFirstOrThrow({
      where: {
        builderId: search,
        season: currentSeason
      }
    });

    await refreshShareImage(existingNft);

    return Response.json({});
  } catch (error) {
    log.error('Error refreshing share image', { error, search });
    return new Response(`Unknown error: ${(error as Error).message}`, { status: 500 });
  }
}
