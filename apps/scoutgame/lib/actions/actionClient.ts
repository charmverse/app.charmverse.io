import { UnauthorisedActionError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { actionClient } from '@connect-shared/lib/actions/actionClient';

export { actionClient };

export const authActionClient = actionClient.use(async ({ next, ctx }) => {
  const user = ctx.session.user;

  if (!user?.id) {
    throw new UnauthorisedActionError('You are not logged in. Please try to login');
  }

  await prisma.scout.findUniqueOrThrow({
    where: { id: user.id },
    select: { id: true }
  });

  return next({
    ctx: { ...ctx, session: { ...ctx.session, user } }
  });
});
