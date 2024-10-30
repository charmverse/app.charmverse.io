'use server';

import { actionClient } from 'lib/actions/actionClient';
import { loginWithWalletSchema } from 'lib/blockchain/config';
import { findOrCreateWalletUser } from 'lib/blockchain/findOrCreateWalletUser';
import { verifyWalletSignature } from 'lib/blockchain/verifyWallet';

import { saveSession } from './saveSession';

export const loginWithWalletAction = actionClient
  .metadata({ actionName: 'login_with_wallet' })
  .schema(loginWithWalletSchema)
  .action(async ({ ctx, parsedInput }) => {
    const newUserId = ctx.session.anonymousUserId;

    const { walletAddress } = await verifyWalletSignature(parsedInput);
    const user = await findOrCreateWalletUser({ wallet: walletAddress, newUserId });
    await saveSession(ctx, { scoutId: user.id });

    return { success: true, userId: user.id, onboarded: !!user.onboardedAt, user };
  });
