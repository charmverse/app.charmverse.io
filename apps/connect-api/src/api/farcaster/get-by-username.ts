import type { RouterContext } from '@connect-api/koa';
import { PathBasedRouter } from '@connect-api/lib/pathBasedRouter';
import type { FarcasterUser } from 'lib/farcaster/getFarcasterUsersByUsername';
import { getFarcasterUsersByUsername } from 'lib/farcaster/getFarcasterUsersByUsername';

const router = new PathBasedRouter();

router.GET(async (ctx: RouterContext<undefined, FarcasterUser[]>) => {
  const username = ctx.query.username as string;
  ctx.body = await getFarcasterUsersByUsername(username);
});

export default router;
