import * as adapters from '@root/adapters/http';
import { baseUrl } from '@root/config/constants';

import { encrypt } from 'lib/crypto';

export async function POST(req: Request) {
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
      interactor: {
        fid: number;
      };
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
      const token = encrypt(result.action.interactor.fid.toString());
      return Response.json(
        {
          type: 'form',
          title: 'Farcaster User',
          url: `${baseUrl}?token=${token}`
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
      name: 'Weekly Updates',
      icon: 'pencil',
      description: 'Create a weekly updates frame for your product',
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
