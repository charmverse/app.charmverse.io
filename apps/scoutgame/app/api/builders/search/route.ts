import { log } from '@charmverse/core/log';

import { searchBuilders } from 'lib/builders/searchBuilders';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  if (typeof path !== 'string') {
    return new Response('path is required', { status: 400 });
  }
  try {
    const result = await searchBuilders({
      path
    });

    return Response.json(result);
  } catch (error) {
    log.error('Error requesting user from farcaster', { error, path });
    return new Response(`Unknown error: ${(error as Error).message}`, { status: 500 });
  }
}
