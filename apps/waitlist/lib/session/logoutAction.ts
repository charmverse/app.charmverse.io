'use server';

import { log } from '@charmverse/core/log';

import { actionClient } from '../actionClient';

export const logoutAction = actionClient.metadata({ actionName: 'logout' }).action(async ({ ctx }) => {
  const fid = ctx.session.farcasterUser?.fid;
  ctx.session.destroy();
  await ctx.session.save();

  log.info('User logged out', { fid });

  return { success: true };
});
