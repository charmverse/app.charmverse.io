import { baseUrl } from '@packages/config/constants';
import type { FarcasterFrameInteractionToValidate } from '@packages/lib/farcaster/validateFrameInteraction';
import { validateFrameInteraction } from '@packages/lib/farcaster/validateFrameInteraction';

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
          title: 'Create an Update',
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
      name: 'Create an Update',
      icon: 'checkbox',
      description: 'Create a project update',
      imageUrl: 'https://connect.charmverse.io/images/cv-connect-logo.png',
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
