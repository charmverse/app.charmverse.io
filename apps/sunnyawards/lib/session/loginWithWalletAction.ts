'use server';

import { actionClient } from '@connect-shared/lib/actions/actionClient';

import { authSchema } from '../blockchain/config';

export const loginAction = actionClient
  .metadata({ actionName: 'login_with_wallet' })
  .schema(authSchema)
  .action(async ({ ctx, parsedInput }) => {
    const loggedInUser = await logiv;

    log.info('User logged in with Farcaster', { userId: loggedInUser.id, method: 'farcaster' });

    ctx.session.anonymousUserId = undefined;
    ctx.session.user = { id: loggedInUser.id };
    await ctx.session.save();

    return { success: true, userId: loggedInUser.id };
  });
