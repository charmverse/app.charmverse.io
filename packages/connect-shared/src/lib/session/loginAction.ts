'use server';

import { log } from '@charmverse/core/log';
import { loginWithFarcaster } from '@root/lib/farcaster/loginWithFarcaster';
import * as yup from 'yup';

import { actionClient } from '../actions/actionClient';

export const loginWithFarcasterAction = actionClient
  .metadata({ actionName: 'login' })
  .schema(yup.object({})) // accept all body input
  .action(async ({ ctx, parsedInput }) => {
    const loggedInUser = await loginWithFarcaster({ ...(parsedInput as any), newUserId: ctx.session.anonymousUserId });

    log.info('User logged in with Farcaster', { userId: loggedInUser.id, method: 'farcaster' });

    ctx.session.anonymousUserId = undefined;
    ctx.session.user = { id: loggedInUser.id };
    await ctx.session.save();

    return { success: true, userId: loggedInUser.id };
  });
