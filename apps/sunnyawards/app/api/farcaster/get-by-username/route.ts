import { log } from '@charmverse/core/log';
import { getFarcasterUsers } from '@root/lib/farcaster/getFarcasterUsers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  if (typeof username !== 'string') {
    return new Response('username is required', { status: 400 });
  }
  try {
    const result = await getFarcasterUsers({
      username
    });

    return Response.json(result);
  } catch (error) {
    log.error('Error requesting user from farcaster', { error, username });
    return new Response(`Unknown error: ${(error as Error).message}`, { status: 500 });
  }
}
