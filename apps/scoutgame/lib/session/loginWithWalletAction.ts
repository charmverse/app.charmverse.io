'use server';

import { actionClient } from 'lib/actions/actionClient';
import { findOrCreateWalletUser } from 'lib/blockchain/findOrCreateWalletUser';
import { verifyWalletSignature } from 'lib/blockchain/verifyWallet';

import { authSchema } from '../blockchain/config';

import { saveSession } from './saveSession';

export const loginAction = actionClient
  .metadata({ actionName: 'login_with_wallet' })
  .schema(authSchema)
  .action(async ({ ctx, parsedInput }) => {
    const newUserId = ctx.session.anonymousUserId;

    const { walletAddress } = await verifyWalletSignature(parsedInput);
    const user = await findOrCreateWalletUser({ wallet: walletAddress, newUserId });

    await saveSession(ctx, { user });

    return { success: true, userId: user.id };
  });
