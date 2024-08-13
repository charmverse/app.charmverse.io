import { baseUrl } from '@root/config/constants';

import { encrypt } from 'lib/crypto';
import { validateFarcasterFrame } from 'lib/validateFarcasterFrame';

export async function POST(req: Request) {
  const { fid } = await validateFarcasterFrame(await req.json());
  const token = encrypt(fid.toString());
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
