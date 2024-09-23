'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { getWalletClient } from '@root/lib/blockchain/walletClient';
import { isAddress } from 'viem';
import * as yup from 'yup';

import { authActionClient } from 'lib/actions/actionClient';

import { builderContractAddress, builderNftChain, builderSmartContractOwnerKey } from './constants';
import { ContractApiClient } from './nftContractApiClient';

export const saveOnboardedAction = authActionClient
  .metadata({ actionName: 'save-onboarded' })
  .schema(
    yup.object().shape({
      address: yup
        .string()
        .required()
        .test((v) => {
          if (!isAddress(v)) {
            throw new Error('Address is required');
          }
        }),
      tokenId: yup.string().required(),
      amount: yup.number().required()
    })
  )
  .action(async ({ ctx, parsedInput }) => {
    const userId = ctx.session.user?.id;

    if (!userId) {
      throw new Error('User not found');
    }

    const serverClient = getWalletClient({ chainId: 1, privateKey: builderSmartContractOwnerKey });

    const apiClient = new ContractApiClient({
      chain: builderNftChain,
      contractAddress: builderContractAddress,
      walletClient: serverClient
    });

    await apiClient.mint({
      args: {
        account: parsedInput.address,
        tokenId: BigInt(parsedInput.tokenId),
        amount: BigInt(parsedInput.amount)
      }
    });

    return { success: true };
  });
