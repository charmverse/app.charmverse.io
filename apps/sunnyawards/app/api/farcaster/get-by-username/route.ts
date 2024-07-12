import { getFarcasterUsers } from '@root/lib/farcaster/getFarcasterUsers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  if (typeof username !== 'string') {
    return new Response('username is required', { status: 400 });
  }
  const result = await getFarcasterUsers({
    username
  });

  return Response.json(result);
}
