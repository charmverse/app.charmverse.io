import { UnauthorisedActionError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { IronSession } from 'iron-session';
import { getIronSession } from 'iron-session';
import { cookies, headers } from 'next/headers';
import { createSafeActionClient } from 'next-safe-action/typeschema';
import * as yup from 'yup';

import type { SessionData } from 'lib/session/config';
import { getIronOptions } from 'lib/session/getIronOptions';

import { handleReturnedServerError, handleServerErrorLog } from './onError';

export const defineMetadataSchema = () =>
  yup.object({
    actionName: yup.string()
  });

export const actionClient = createSafeActionClient({
  handleReturnedServerError,
  handleServerErrorLog,
  // @ts-ignore
  defineMetadataSchema,
  defaultValidationErrorsShape: 'flattened'
})
  /**
   * Middleware used for auth purposes.
   * Returns the context with the session object.
   */
  .use(async ({ next }) => {
    const session = await getIronSession<SessionData>(cookies(), getIronOptions());
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
