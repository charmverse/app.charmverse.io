import type { Context } from 'koa';

import type { RouterContext } from '@connect-api/koa';
import { PathBasedRouter } from '@connect-api/lib/pathBasedRouter';

const router = new PathBasedRouter();

router.GET((ctx) => {
  ctx.body = {
    message: 'Hello, World!'
  };
});

router.POST((ctx: RouterContext<{ message: string }, { messages: string; received: string }>) => {
  ctx.body = {
    messages: 'Hello!',
    received: ctx.request.body.message
  };
});

export default router;
