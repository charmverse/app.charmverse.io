import { baseUrl } from '@root/config/constants';
import type { FarcasterFrameInteractionToValidate } from '@root/lib/farcaster/validateFrameInteraction';
import { validateFrameInteraction } from '@root/lib/farcaster/validateFrameInteraction';
import type { FrameButton, FrameButtonsType } from 'frames.js';
import { getFrameHtml } from 'frames.js';

import { getProductUpdatesFrame } from 'lib/productUpdates/getProductUpdatesFrame';

export async function POST(req: Request) {
  const url = new URL(req.url);
  const frameId = url.pathname.split('/').pop();
  if (!frameId) {
    return Response.json(
      {},
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }

  const data = (await req.json()) as FarcasterFrameInteractionToValidate;
  const messageBytes = data.trustedData.messageBytes;
  const result = await validateFrameInteraction(messageBytes);

  if (result.valid) {
    const timestamp = Math.floor(new Date(result.action.timestamp).getTime() / 1000);
    if (timestamp > new Date().getTime() / 1000 - 60) {
      const productUpdatesFrame = await getProductUpdatesFrame(frameId);
      if (!productUpdatesFrame) {
        return Response.json(
          {},
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }

      const { image, nextFrameId, previousFrameId } = productUpdatesFrame;
      const buttons: FrameButton[] = [];

      if (previousFrameId) {
        buttons.push({
          action: 'post',
          label: 'Previous',
          target: `${baseUrl}/api/product-updates/frames/${previousFrameId}`
        });
      }

      if (nextFrameId) {
        buttons.push({
          action: 'post',
          label: 'Next',
          target: `${baseUrl}/api/product-updates/frames/${nextFrameId}`
        });
      }

      const html = getFrameHtml({
        image,
        version: 'vNext',
        buttons: buttons as FrameButtonsType,
        ogImage: image
      });

      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html'
        }
      });
    }
  }
  return Response.json(
    {},
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}
