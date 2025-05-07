import { prisma } from '@charmverse/core/prisma-client';
import { baseUrl } from '@packages/config/constants';
import { getFrameHtml } from 'frames.js';

import { validateFarcasterFrame } from 'lib/validateFarcasterFrame';

export async function POST(req: Request) {
  const frameId = req.url.split('/').at(-2);

  const { fid: actorFid } = await validateFarcasterFrame(await req.json());

  const productUpdatesFarcasterFrame = await prisma.productUpdatesFarcasterFrame.findUniqueOrThrow({
    where: {
      id: frameId,
      author: {
        farcasterUser: {
          fid: actorFid
        }
      }
    },
    select: {
      image: true
    }
  });

  const html = getFrameHtml({
    image: productUpdatesFarcasterFrame.image,
    imageAspectRatio: '1:1',
    version: 'vNext',
    buttons: [
      {
        action: 'post',
        label: 'Cancel',
        target: `${baseUrl}/product-updates/frames/${frameId}`
      },
      {
        action: 'post',
        label: 'Delete',
        target: `${baseUrl}/api/product-updates/frames/${frameId}/delete`
      }
    ],
    ogImage: productUpdatesFarcasterFrame.image
  });

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html'
    }
  });
}
