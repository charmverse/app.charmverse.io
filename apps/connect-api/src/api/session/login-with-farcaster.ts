import { log } from '@charmverse/core/log';
import type { RouterContext } from '@connect-api/koa';
import { PathBasedRouter } from '@connect-api/lib/pathBasedRouter';
import type { LoggedInUser } from '@connect-shared/lib/profile/getCurrentUserAction';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import { loginWithFarcaster } from '@root/lib/farcaster/loginWithFarcaster';

const router = new PathBasedRouter();

router.POST(async (ctx: RouterContext<FarcasterBody, LoggedInUser>) => {
  const loggedInUser = await loginWithFarcaster(ctx.request.body);

  log.info('User logged in with Farcaster', { userId: loggedInUser.id, method: 'farcaster' });

  ctx.request.session.user = { id: loggedInUser.id };

  await ctx.request.session.save();

  ctx.body = loggedInUser;
});

export default router;
