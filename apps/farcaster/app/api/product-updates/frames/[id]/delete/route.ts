import { prisma } from '@charmverse/core/prisma-client';
import { baseUrl } from '@packages/config/constants';

import { getProductUpdatesFrame } from 'lib/productUpdates/getProductUpdatesFrame';
import { validateFarcasterFrame } from 'lib/validateFarcasterFrame';

export async function POST(req: Request) {
  const frameId = req.url.split('/').at(-2) as string;

  const { fid: actorFid } = await validateFarcasterFrame(await req.json());

  const productUpdatesFrame = await getProductUpdatesFrame(frameId);

  if (!productUpdatesFrame) {
    throw new Error('Frame not found');
  }

  const { authorFid, nextFrameId, previousFrameId } = productUpdatesFrame;

  if (!authorFid || authorFid !== actorFid) {
    throw new Error('Frame not found');
  }

  await prisma.productUpdatesFarcasterFrame.delete({
    where: {
      id: frameId
    }
  });

  const redirectUrl = `${baseUrl}/product-updates/frames/${nextFrameId || previousFrameId}`;

  // Return a response with a redirect
  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectUrl
    }
  });
}
