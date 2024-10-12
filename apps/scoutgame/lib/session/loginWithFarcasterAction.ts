'use server';

import { actionClient } from 'lib/actions/actionClient';
import { findOrCreateFarcasterUser } from 'lib/farcaster/findOrCreateFarcasterUser';
import { verifyFarcasterUser } from 'lib/farcaster/verifyFarcasterUser';

import { authSchema } from '../farcaster/config';

import { authorizeUserByLaunchDate } from './authorizeUserByLaunchDate';
import { saveSession } from './saveSession';

export const loginWithFarcasterAction = actionClient
  .metadata({ actionName: 'login_with_farcaster' })
  .schema(authSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { fid } = await verifyFarcasterUser(parsedInput);
    await authorizeUserByLaunchDate({ fid });
    const user = await findOrCreateFarcasterUser({ fid });

    await saveSession(ctx, { scoutId: user.id });

    return { success: true, userId: user.id, onboarded: !!user.onboardedAt, user };
  });
