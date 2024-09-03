'use server';

import { log } from '@charmverse/core/log';
import { loginWithFarcaster } from '@root/lib/farcaster/loginWithFarcaster';
import * as yup from 'yup';

import { actionClient } from '../actionClient';

export const loginWithFarcasterAction = actionClient
  .metadata({ actionName: 'login' })
  .schema(yup.object({ fid: yup.number(), username: yup.string() })) // accept all body input
  .action(async ({ ctx, parsedInput }) => {
    log.info('User logged in to waitlist', { fid: parsedInput.fid, username: parsedInput.username });

    ctx.session.farcasterUser = { fid: parsedInput.fid?.toString() as string, username: parsedInput.username };
    await ctx.session.save();

    return { success: true, fid: parsedInput.fid };
  });
