'use server';

import { log } from '@charmverse/core/log';

import { actionClient } from '../actionClient';

import { getSession } from './getSession';

export const logoutAction = actionClient.metadata({ actionName: 'logout' }).action(async ({ ctx }) => {
  const fid = ctx.session.farcasterUser?.fid;
  const session = await getSession();
  session.destroy();

  log.info('User logged out', { fid });

  return { success: true };
});
