'use server';

import { InvalidInputError } from '@charmverse/core/errors';
import { actionClient } from '@packages/connect-shared/lib/actions/actionClient';
import { isValidEoaOrGnosisWalletSignature } from '@root/lib/blockchain/signAndVerify';
import { getDomain } from '@root/lib/utils/strings';

import { authSchema } from '../blockchain/config';

import { createOrGetUserFromWallet } from './createOrGetUserWithWallet';

export const loginWithWalletAction = actionClient
  .metadata({ actionName: 'login_with_wallet' })
  .schema(authSchema)
  .action(async ({ ctx, parsedInput }) => {
    const isValidSignin = await isValidEoaOrGnosisWalletSignature({
      message: parsedInput.message as any,
      signature: parsedInput.signature as `0x${string}`,
      address: parsedInput.address,
      domain: getDomain(process.env.DOMAIN as string)
    });

    if (!isValidSignin) {
      throw new InvalidInputError('Invalid wallet signature');
    }

    const { user: loggedInUser } = await createOrGetUserFromWallet({
      address: parsedInput.address
    });

    ctx.session.anonymousUserId = undefined;
    ctx.session.user = { id: loggedInUser.id };
    await ctx.session.save();

    return { success: true, userId: loggedInUser.id };
  });
