import { UnauthorisedActionError } from '@charmverse/core/errors';
import { handleReturnedServerError, handleServerErrorLog } from '@connect-shared/lib/actions/onError';
import { headers } from 'next/headers';
import { createSafeActionClient } from 'next-safe-action';
import { yupAdapter } from 'next-safe-action/adapters/yup';
import * as yup from 'yup';

import { getSession } from './session/getSession';

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
  const farcasterUser = ctx.session.farcasterUser;

  // We only validate a valid session exists, since we might not have a corresponding connect waitlist slot
  if (!farcasterUser?.fid) {
    throw new UnauthorisedActionError('You are not logged in. Please try to login');
  }
  return next({
    ctx: { ...ctx, session: { ...ctx.session, farcasterUser } }
  });
});
