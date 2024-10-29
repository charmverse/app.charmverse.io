import { log } from '@charmverse/core/log';

import { searchBuilders } from 'lib/builders/searchBuilders';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  if (typeof search !== 'string') {
    return new Response('path is required', { status: 400 });
  }
  try {
    const result = await searchBuilders({
      search
    });

    return Response.json(result);
  } catch (error) {
    log.error('Error requesting user from farcaster', { error, search });
    return new Response(`Unknown error: ${(error as Error).message}`, { status: 500 });
  }
}
