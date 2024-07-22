import { UnauthorisedActionError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { IronSession } from 'iron-session';
import { headers } from 'next/headers';
import { createSafeActionClient } from 'next-safe-action';
import * as yup from 'yup';

import type { SessionData } from 'lib/session/config';
import { getSession } from 'lib/session/getSession';

import { handleReturnedServerError, handleServerErrorLog } from './onError';

export function defineMetadataSchema() {
  return yup.object({
    actionName: yup.string()
  });
}

export const actionClient = createSafeActionClient({
  defineMetadataSchema,
  handleReturnedServerError,
  handleServerErrorLog,
  defaultValidationErrorsShape: 'flattened'
})
  /**
   * Middleware used for auth purposes.
   * Returns the context with the session object.
   */
  .use(async ({ next }) => {
    const session = await getSession();
    const headerList = headers();

    return next({
      ctx: { session, headers: headerList }
    });
  });

export const authActionClient = actionClient.use(async ({ next, ctx }) => {
  const userId = ctx.session.user?.id;

  if (!userId) {
    throw new UnauthorisedActionError('You are not logged in. Please try to login');
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true }
  });

  const session: IronSession<Required<Pick<SessionData, 'user'>>> = { ...ctx.session, user };

  return next({ ctx: { ...ctx, session } });
});
