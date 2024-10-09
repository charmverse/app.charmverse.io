import { UnauthorisedActionError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { actionClientBase } from '@connect-shared/lib/actions/actionClient';
import { headers } from 'next/headers';

import { getSession } from 'lib/session/getSession';

export const actionClient = actionClientBase.use(async ({ next }) => {
  const session = await getSession();
  const headerList = headers();

  const adminId = session.adminId;

  if (!adminId) {
    throw new UnauthorisedActionError('You are not logged in. Please try to login');
  }
  await prisma.scout.findUniqueOrThrow({
    where: { id: adminId },
    select: { id: true }
  });

  return next({
    ctx: { session, headers: headerList }
  });
});
