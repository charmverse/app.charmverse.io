import type { RouterContext } from '@connect-api/koa';
import { PathBasedRouter } from '@connect-api/lib/pathBasedRouter';

const router = new PathBasedRouter();

router.POST(async (ctx: RouterContext<void, void>) => {
  ctx.request.session.destroy();
});

export default router;
