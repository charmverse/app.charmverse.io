'use server';

import { log } from '@charmverse/core/log';

import { actionClient } from '../actions/actionClient';

export const logoutAction = actionClient.metadata({ actionName: 'logout' }).action(async ({ ctx }) => {
  const userId = ctx.session.user?.id;
  ctx.session.destroy();
  await ctx.session.save();

  log.info('User logged out', { userId });

  return { success: true };
});
