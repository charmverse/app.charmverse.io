'use server';

import { log } from '@charmverse/core/log';
import { actionClient } from '@connect-shared/lib/actions/actionClient';

import { loginUser } from './loginUser';
import { schema } from './loginUserSchema';

export const loginAction = actionClient
  .metadata({ actionName: 'login' })
  .schema(schema)
  .action(async ({ ctx, parsedInput }) => {
    if (!parsedInput.type) {
      throw new Error('Invalid login type');
    }
    const loggedInUser = await loginUser({ ...parsedInput, anonymousUserId: ctx.session.anonymousUserId });

    log.info(`User logged in`, { userId: loggedInUser.id, method: parsedInput.type });

    ctx.session.anonymousUserId = undefined;
    ctx.session.user = { id: loggedInUser.id };
    await ctx.session.save();

    return { success: true, userId: loggedInUser.id };
  });
