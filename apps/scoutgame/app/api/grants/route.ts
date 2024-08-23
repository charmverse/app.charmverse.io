import { getGrants, type GetGrantsPayload } from '@connect-shared/lib/grants/getGrants';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const urlSearchParams = new URLSearchParams(req.url?.split('?')[1]);
  const sort = (urlSearchParams.get('sort') || 'new') as GetGrantsPayload['sort'];
  const cursor = (urlSearchParams.get('cursor') || null) as GetGrantsPayload['cursor'];
  const limit = urlSearchParams.get('limit') ? parseInt(urlSearchParams.get('limit') as string, 10) : 5;
  const grants = await getGrants({
    sort,
    cursor,
    limit
  });
  const response = new Response(JSON.stringify(grants), {
    status: 200
  });
  response.headers.set('Content-Type', 'application/json');

  return response;
}
