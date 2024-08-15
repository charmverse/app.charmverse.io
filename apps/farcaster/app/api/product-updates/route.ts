import { baseUrl } from '@root/config/constants';
import type { FarcasterFrameInteractionToValidate } from '@root/lib/farcaster/validateFrameInteraction';
import { validateFrameInteraction } from '@root/lib/farcaster/validateFrameInteraction';

import { encrypt } from 'lib/crypto';

export async function POST(req: Request) {
  const data = (await req.json()) as FarcasterFrameInteractionToValidate;
  const messageBytes = data.trustedData.messageBytes;
  const result = await validateFrameInteraction(messageBytes);

  if (result.valid) {
    const timestamp = Math.floor(new Date(result.action.timestamp).getTime() / 1000);
    if (timestamp > new Date().getTime() / 1000 - 60) {
      const token = encrypt(result.action.interactor.fid.toString());
      return Response.json(
        {
          type: 'form',
          title: 'Product updates',
          url: `${baseUrl}/product-updates?token=${token}`
        },
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
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

export async function GET() {
  return Response.json(
    {
      type: 'composer',
      name: 'Product updates',
      icon: 'pencil',
      description: 'Create a product updates frame for your cast',
      aboutUrl: baseUrl,
      imageUrl: 'https://connect.charmverse.io/favicon.ico',
      action: {
        type: 'post'
      }
    },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}
