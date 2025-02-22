'use server';

import { InvalidInputError } from '@charmverse/core/errors';
import { actionClient } from '@packages/nextjs/actions/actionClient';
import { isValidEoaOrGnosisWalletSignature } from '@root/lib/blockchain/signAndVerify';

import { authSchema } from '../blockchain/config';

import { createOrGetUserFromWallet } from './createOrGetUserWithWallet';

export const loginWithWalletAction = actionClient
  .metadata({ actionName: 'login_with_wallet' })
  .schema(authSchema)
  .action(async ({ ctx, parsedInput }) => {
    const isValidSignin = await isValidEoaOrGnosisWalletSignature({
      message: parsedInput.message,
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

// example: https://google.com/search?q=3531422 -> https://google.com
function getDomain(url: string, includeProtocol?: boolean) {
  if (!url.includes('http')) {
    // invalid url, oh well
    return url;
  }
  const pathArray = url.split('/');
  const protocol = pathArray[0];
  const host = pathArray[2];
  if (includeProtocol) {
    return `${protocol}//${host}`;
  }
  return host;
}
