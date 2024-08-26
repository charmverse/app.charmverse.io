import { UnauthorisedActionError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { headers } from 'next/headers';
import { createSafeActionClient } from 'next-safe-action';
import { yupAdapter } from 'next-safe-action/adapters/yup';
import * as yup from 'yup';

import { getSession } from '../session/getSession';

import { handleReturnedServerError, handleServerErrorLog } from './onError';

export function defineMetadataSchema() {
  return yup.object({
    actionName: yup.string()
  });
}

export const actionClient = createSafeActionClient({
  validationAdapter: yupAdapter(),
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
  const user = ctx.session.user;
  const userId = user?.id;

  if (!user) {
    throw new UnauthorisedActionError('You are not logged in. Please try to login');
  }

  const data = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });

  if (!data) {
    ctx.session.destroy();
    log.warn('User has a session that is not found in the db', { userId });
  }

  return next({
    ctx: { ...ctx, session: { ...ctx.session, user } }
  });
});
