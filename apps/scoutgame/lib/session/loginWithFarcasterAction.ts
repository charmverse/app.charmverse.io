'use server';

import env from '@beam-australia/react-env';
import { log } from '@charmverse/core/log';
import { authSecret } from '@root/config/constants';
import { sealData } from 'iron-session';
import { cookies } from 'next/headers';

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
    const user = await findOrCreateFarcasterUser({ fid });

    if (inviteCode && parsedInput.inviteCode === inviteCode) {
      await saveSession(ctx, { scoutId: user.id });

      cookies().set(
        'invite-code',
        await sealData(
          {
            inviteCode
          },
          {
            password: authSecret as string
          }
        )
      );
      log.info('Builder logged in with invite code', { userId: user.id, fid });
    } else {
      await authorizeUserByLaunchDate({ fid });
    }

    return { success: true, userId: user.id, onboarded: !!user.onboardedAt, user };
  });
