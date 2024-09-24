'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { getWalletClient } from '@root/lib/blockchain/walletClient';
import { prettyPrint } from '@root/lib/utils/strings';
import { isAddress } from 'viem';
import * as yup from 'yup';

import { authActionClient } from 'lib/actions/actionClient';

import { builderContractAddress, builderNftChain, builderSmartContractOwnerKey } from './constants';
import { ContractApiClient } from './nftContractApiClient';
import { refreshBuilderNftPrice } from './refreshBuilderNftPrice';

export const mintNftAction = authActionClient
  .metadata({ actionName: 'save-onboarded' })
  .schema(
    yup.object().shape({
      address: yup
        .string()
        .required()
        .test('Valid address', (v) => {
          if (!isAddress(v)) {
            return false;
          }
          return true;
        }),
      tokenId: yup.string().required(),
      amount: yup.number().required(),
      builderId: yup.string().required()
    })
  )
  .action(async ({ ctx, parsedInput }) => {
    const userId = ctx.session.user?.id;

    if (!userId) {
      throw new Error('User not found');
    }

    prettyPrint({
      builderNftChain: builderNftChain.id,
      contractAddress: builderContractAddress
    });

    const builderNft = await prisma.builderNft.findFirstOrThrow({
      where: {
        chainId: builderNftChain.id,
        contractAddress: builderContractAddress
      }
    });

    const serverClient = getWalletClient({ chainId: builderNftChain.id, privateKey: builderSmartContractOwnerKey });

    const apiClient = new ContractApiClient({
      chain: builderNftChain,
      contractAddress: builderContractAddress,
      walletClient: serverClient
    });

    const nextPrice = await apiClient.getTokenPurchasePrice({
      args: {
        tokenId: BigInt(parsedInput.tokenId),
        amount: BigInt(parsedInput.amount)
      }
    });

    const txResult = await apiClient.mint({
      args: {
        account: parsedInput.address,
        tokenId: BigInt(parsedInput.tokenId),
        amount: BigInt(parsedInput.amount)
      }
    });

    await prisma.nFTPurchaseEvent.create({
      data: {
        // Assuming constant conversion rate of 4:1, and 6 decimals on USDC
        pointsValue: Number(nextPrice) / 10e6 / 4,
        tokensPurchased: parsedInput.amount,
        txHash: txResult.transactionHash,
        builderNftId: builderNft.id,
        scoutId: userId
      }
    });

    await refreshBuilderNftPrice({ builderId: parsedInput.builderId });

    return { success: true };
  });
