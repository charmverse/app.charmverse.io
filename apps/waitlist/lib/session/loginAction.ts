'use server';

import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { StatusAPIResponse } from '@farcaster/auth-kit';
import * as yup from 'yup';

import { actionClient } from '../actionClient';

import { getSession } from './getSession';

export const loginWithFarcasterAction = actionClient
  .metadata({ actionName: 'login' })
  .schema(yup.object({ loginPayload: yup.object<StatusAPIResponse>({}) })) // accept all body input
  .action(async ({ parsedInput }) => {
    const { fid, username } = parsedInput.loginPayload as StatusAPIResponse;

    log.info('User logged in to waitlist', { fid, username });

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
