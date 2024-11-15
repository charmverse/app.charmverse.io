import { UnauthorisedActionError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { actionClient } from '@packages/scoutgame/actions/actionClient';

export { actionClient };

export const authActionClient = actionClient.use(async ({ next, ctx }) => {
  const scoutId = ctx.session.scoutId;

  if (!scoutId) {
    throw new UnauthorisedActionError('You are not logged in. Please try to login');
  }

  await prisma.scout.findUniqueOrThrow({
    where: { id: scoutId },
    select: { id: true }
  });

  return next({
    ctx: { ...ctx, session: { ...ctx.session, scoutId } }
  });
});
