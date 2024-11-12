'use server';

import { log } from '@charmverse/core/log';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import { getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import { type SessionUser } from '@packages/scoutgame/session/interfaces';
import { authSecret } from '@root/config/constants';
import { sealData } from 'iron-session';
import { cookies } from 'next/headers';

import { actionClient } from 'lib/actions/actionClient';
import { findOrCreateWalletUser } from 'lib/blockchain/findOrCreateWalletUser';
import { loginWithWalletSchema } from 'lib/blockchain/schema';
import { verifyWalletSignature } from 'lib/blockchain/verifyWallet';

import { saveSession } from './saveSession';

export const loginWithWalletAction = actionClient
  .metadata({ actionName: 'login_with_wallet' })
  .schema(loginWithWalletSchema)
  .action(async ({ ctx, parsedInput }) => {
    const newUserId = ctx.session.anonymousUserId;
    const { walletAddress } = await verifyWalletSignature(parsedInput);

    if (parsedInput.inviteCode) {
      cookies().set(
        'invite-code',
        await sealData({ inviteCode: parsedInput.inviteCode }, { password: authSecret as string })
      );
      log.info(`Builder logged in with invite code: ${parsedInput.inviteCode}`, { walletAddress });
    }

    const user = await findOrCreateWalletUser({ wallet: walletAddress, newUserId });
    await saveSession(ctx, { scoutId: user.id });
    const sessionUser = (await getUserFromSession()) as SessionUser;

    if (user.isNew) {
      trackUserAction('sign_up', {
        userId: user.id
      });
    } else {
      trackUserAction('sign_in', {
        userId: user.id
      });
    }

    return {
      user: sessionUser,
      success: true,
      onboarded: !!sessionUser.onboardedAt
    };
  });
