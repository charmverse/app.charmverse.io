import * as adapters from '@root/adapters/http';
import { baseUrl } from '@root/config/constants';
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

  const data = (await req.json()) as {
    untrustedData: {
      fid: number;
      url: string;
      messageHash: string;
      timestamp: number;
      network: number;
      buttonIndex: number;
      state: string;
    };
    trustedData: {
      messageBytes: string;
    };
  };
  const messageBytes = data.trustedData.messageBytes;
  const result = await adapters.POST<{
    valid: boolean;
    action: {
      timestamp: string;
    };
  }>(
    'https://api.neynar.com/v2/farcaster/frame/validate',
    {
      message_bytes_in_hex: messageBytes
    },
    {
      headers: {
        Api_key: process.env.NEYNAR_API_KEY
      }
    }
  );

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
      if (nextFrameId) {
        buttons.push({
          action: 'post',
          label: 'Next',
          target: `${baseUrl}/api/product-updates/frames/${nextFrameId}`
        });
      }
      if (previousFrameId) {
        buttons.push({
          action: 'post',
          label: 'Previous',
          target: `${baseUrl}/api/product-updates/frames/${previousFrameId}`
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
