'use server';

import { authSchema } from '@packages/farcaster/config';
import { verifyFarcasterUser } from '@packages/farcaster/verifyFarcasterUser';

import { actionClient } from 'lib/actions/actionClient';

import { getAdminUser } from './getAdminUser';
import { saveSession } from './saveSession';

export const loginAction = actionClient
  .metadata({ actionName: 'login_with_farcaster' })
  .schema(authSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { fid } = await verifyFarcasterUser(parsedInput);

    const adminUser = await getAdminUser({ fid });
    if (!adminUser) {
      throw new Error('Sign-in requires admin access');
    }

    await saveSession(ctx, { adminId: adminUser.id });

    return { success: true, userId: adminUser.id };
  });
