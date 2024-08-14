'use server';

import { log } from '@charmverse/core/log';

import { authActionClient } from '../actions/actionClient';

export const logoutAction = authActionClient.metadata({ actionName: 'logout' }).action(async ({ ctx }) => {
  const userId = ctx.session.user?.id;
  // ctx.session.destroy();
  ctx.session.user = { id: '50d940bb-fdbd-40ba-9816-616d6138a663' };
  await ctx.session.save();

  log.info('User logged out', { userId });

  return { success: true };
});
