'use server';

import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { deterministicV4UUIDFromFid } from '@connect-shared/lib/farcaster/uuidFromFid';
import type { StatusAPIResponse } from '@farcaster/auth-kit';
import * as yup from 'yup';

import { trackWaitlistMixpanelEvent } from 'lib/mixpanel/trackWaitlistMixpanelEvent';

import { actionClient } from '../actionClient';

import { getSession } from './getSession';

export const loginWithFarcasterAction = actionClient
  .metadata({ actionName: 'login' })
  .schema(yup.object({ loginPayload: yup.object<StatusAPIResponse>({}) })) // accept all body input
  .action(async ({ parsedInput }) => {
    const { fid, username } = parsedInput.loginPayload as StatusAPIResponse;

    log.info('User logged in to waitlist', { fid, username });

    trackWaitlistMixpanelEvent('login', { userId: deterministicV4UUIDFromFid(fid as number) });

    const currentWaitlistSlot = await prisma.connectWaitlistSlot.findUnique({
      where: {
        fid: parseInt(fid?.toString() as string)
      }
    });

    const hasJoinedWaitlist = !!currentWaitlistSlot;

    const session = await getSession();
    session.farcasterUser = { fid: fid?.toString() as string, username, hasJoinedWaitlist };
    await session.save();

    return { success: true, fid, hasJoinedWaitlist };
  });
