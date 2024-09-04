'use server';

import { log } from '@charmverse/core/log';

import { refreshPercentilesForEveryone } from 'lib/scoring/refreshPercentilesForEveryone';

import { authActionClient } from '../actionClient';

import { joinWaitlist } from './joinWaitlist';

export const joinWaitlistAction = authActionClient.metadata({ actionName: 'join-waitlist' }).action(async ({ ctx }) => {
  const fid = ctx.session.farcasterUser.fid;
  const username = ctx.session.farcasterUser.username || '-';

  const waitlistJoinResult = await joinWaitlist({
    fid,
    username
  });

  await refreshPercentilesForEveryone();

  if (waitlistJoinResult.isNew) {
    log.info(`User joined waitlist`, { fid, username });
  }

  return { success: true };
});
