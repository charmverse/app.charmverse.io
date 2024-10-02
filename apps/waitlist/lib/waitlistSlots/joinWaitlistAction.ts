'use server';

import { log } from '@charmverse/core/log';

import { handleTierChanges, refreshPercentilesForEveryone } from 'lib/scoring/refreshPercentilesForEveryone';
import { getSession } from 'lib/session/getSession';

import { authActionClient } from '../actionClient';

import { joinWaitlist } from './joinWaitlist';

export const joinWaitlistAction = authActionClient.metadata({ actionName: 'join-waitlist' }).action(async ({ ctx }) => {
  const farcasterUser = ctx.session.farcasterUser;
  const fid = farcasterUser.fid;
  const username = farcasterUser.username || '-';

  const waitlistJoinResult = await joinWaitlist({
    fid,
    username,
    waitlistAnalytics: {
      source: 'webapp'
    }
  });

  // If user is new, refresh everyone's percentiles and notify them of their new tier
  // if (waitlistJoinResult.isNew) {
  //   const percentileChangeResults = await refreshPercentilesForEveryone();

  //   handleTierChanges(percentileChangeResults);
  //   log.info(`User joined waitlist`, { fid, username });
  // }

  // When modifying the session we need to get the original one. The one stored in ctxhas just the data but not the methods.
  const session = await getSession();
  session.farcasterUser = {
    ...farcasterUser,
    hasJoinedWaitlist: true
  };

  await session.save();

  return { success: true };
});
