'use server';

import { log } from '@charmverse/core/log';

import { authActionClient } from 'lib/actions/actionClient';

export const logoutAction = authActionClient.metadata({ actionName: 'login' }).action(async ({ ctx }) => {
  const userId = ctx.session.user?.id;
  ctx.session.destroy();

  log.info('User logged out with Farcaster', { userId, method: 'farcaster' });

  return { success: true };
});
