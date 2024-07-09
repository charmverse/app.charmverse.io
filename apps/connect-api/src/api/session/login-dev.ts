import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';

import type { RouterContext } from '@connect-api/koa';
import { PathBasedRouter } from '@connect-api/lib/pathBasedRouter';
import { InvalidInputError } from 'lib/utils/errors';
import { randomIntFromInterval } from 'lib/utils/random';
import type { LoggedInUser } from 'models';

const router = new PathBasedRouter();

const isTestEnv = process.env.REACT_APP_APP_ENV === 'test';

const demoAvatar =
  'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=168/https%3A%2F%2Fapp.charmverse.io%2Ffavicon.png';

router.GET(async (ctx: RouterContext<FarcasterBody, LoggedInUser>) => {
  if (!isTestEnv) {
    throw new InvalidInputError('This endpoint is only available in test environment');
  }

  const userId = ctx.query.userId;

  if (!userId) {
    const newUserId = await testUtilsUser.generateUser().then((user) => user.id);

    const randomInt = randomIntFromInterval(1, 1000000);

    await prisma.user.update({
      where: {
        id: newUserId
      },
      data: {
        username: `demo-${randomInt}`,
        avatar: demoAvatar
      }
    });

    await prisma.farcasterUser.create({
      data: {
        fid: randomInt,
        userId: newUserId,
        account: {
          username: `example-user-${randomInt}`,
          displayName: `display-${randomInt}`,
          bio: 'dev user',
          pfpUrl: demoAvatar
        }
      }
    });

    ctx.request.session.user = { id: newUserId };

    await ctx.request.session.save();
  } else {
    const user = await prisma.user.findFirstOrThrow({
      where: {
        id: userId as string
      },
      select: {
        id: true
      }
    });

    ctx.request.session.user = { id: user.id };

    await ctx.request.session.save();
  }

  ctx.status = 200;
});

export default router;
