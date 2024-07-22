import { UnauthorisedActionError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { headers } from 'next/headers';
import { createSafeActionClient } from 'next-safe-action';
import { yupAdapter } from 'next-safe-action/adapters/yup';
import * as yup from 'yup';

import { getSession } from 'lib/session/getSession';

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
  const userId = ctx.session.user?.id;

  if (!userId) {
    throw new UnauthorisedActionError('You are not logged in. Please try to login');
  }

  await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true }
  });

  return next({ ctx });
});
