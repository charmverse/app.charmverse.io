import { UnauthorisedActionError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { createSafeActionClient } from 'next-safe-action/typeschema';
import * as yup from 'yup';

import { getIronOptions } from 'lib/session/getIronOptions';
import type { SessionData } from 'lib/session/types';

export const actionClient = createSafeActionClient({
  handleServerErrorLog: async (err) => {
    log.error('errrr', err);
  },
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
  .use(async ({ next, metadata }) => {
    const result = await next({ ctx: null });
    log.info('LOGGING MIDDLEWARE FOR ACTION', metadata);
    return result;
  })
  /**
   * Middleware used for auth purposes.
   * Returns the context with the session object.
   */
  .use(async ({ next }) => {
    const session = await getIronSession<SessionData>(cookies(), getIronOptions());
    return next({
      ctx: { session }
    });
  });

export const authActionClient = actionClient.use(async ({ next, ctx }) => {
  const userId = ctx.session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  // @TODO - add this back when user login with session is ready
  // if (!user) {
  //   throw new UnauthorisedActionError('user is not is not valid!');
  // }

  return next({ ctx });
});
