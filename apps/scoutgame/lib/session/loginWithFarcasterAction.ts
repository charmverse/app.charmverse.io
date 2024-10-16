'use server';

import env from '@beam-australia/react-env';
import { log } from '@charmverse/core/log';

import { actionClient } from 'lib/actions/actionClient';
import { findOrCreateFarcasterUser } from 'lib/farcaster/findOrCreateFarcasterUser';
import { verifyFarcasterUser } from 'lib/farcaster/verifyFarcasterUser';

import { authSchema } from '../farcaster/config';

import { authorizeUserByLaunchDate } from './authorizeUserByLaunchDate';
import { saveSession } from './saveSession';

const inviteCode = env('SCOUTGAME_INVITE_CODE') ?? process.env.REACT_APP_SCOUTGAME_INVITE_CODE;

export const loginWithFarcasterAction = actionClient
  .metadata({ actionName: 'login_with_farcaster' })
  .schema(authSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { fid } = await verifyFarcasterUser(parsedInput);
    if (parsedInput.inviteCode !== inviteCode) {
      await authorizeUserByLaunchDate({ fid });
    } else {
      log.info('User joined with invite code', { fid });
    }
    const user = await findOrCreateFarcasterUser({ fid });

    await saveSession(ctx, { scoutId: user.id });

    return { success: true, userId: user.id, onboarded: !!user.onboardedAt, user };
  });
