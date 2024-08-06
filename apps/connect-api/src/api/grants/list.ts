import type { RouterContext } from '@connect-api/koa';
import { PathBasedRouter } from '@connect-api/lib/pathBasedRouter';
import { getGrants } from '@connect-shared/lib/grants/getGrants';
import type { GetGrantsResponse, GetGrantsPayload } from '@connect-shared/lib/grants/getGrants';

const router = new PathBasedRouter();

router.GET(async (ctx: RouterContext<undefined, GetGrantsResponse>) => {
  const sort = (ctx.query.sort || 'new') as GetGrantsPayload['sort'];
  const cursor = (ctx.query.cursor || null) as GetGrantsPayload['cursor'];
  const limit = ctx.query.limit ? parseInt(ctx.query.limit as string, 10) : 5;

  ctx.body = await getGrants({
    sort,
    cursor,
    limit
  });
});

export default router;
