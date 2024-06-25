import { UnauthorisedActionError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { SessionData } from '@connect/lib/session/types';
import type { IronSession } from 'iron-session';
import { getIronSession } from 'iron-session';
import { cookies, headers } from 'next/headers';
import { createSafeActionClient } from 'next-safe-action/typeschema';
import * as yup from 'yup';

import { getIronOptions } from 'lib/session/getIronOptions';

import { handleServerError } from './onError';

export const actionClient = createSafeActionClient({
  handleReturnedServerError: handleServerError,
  // @ts-ignore
  defineMetadataSchema: () => {
    return yup.object({
      actionName: yup.string()
    });
  }
})
  /**
   * Middleware used for logging purposes.
   */
  .use(async ({ next }) => {
    const result = await next({ ctx: null });
    // log.info('LOGGING MIDDLEWARE FOR ACTION', metadata);
    return result;
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

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  // @TODO - add this back when user login with session is ready
  // if (!user) {
  //   throw new UnauthorisedActionError('user is not is not valid!');
  // }

  const session: IronSession<Required<SessionData>> = { ...ctx.session, user: { id: userId } };

  return next({ ctx: { ...ctx, session } });
});
