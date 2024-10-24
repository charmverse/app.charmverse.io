'use server';

import { prisma } from '@charmverse/core/prisma-client';

import { getBuilderContractMinterClient } from './clients/builderContractMinterWriteClient';
import { recordNftMintAndRefreshPrice } from './recordNftMint';

export type MintNFTParams = {
  builderNftId: string;
  recipientAddress: string;
  amount: number;
  pointsValue: number; // total value of purchase, after 50% discount, etc
  paidWithPoints: boolean; // whether to subtract from the scout's points
  scoutId: string;
};

export async function mintNFT(params: MintNFTParams) {
  const { builderNftId, recipientAddress, amount, scoutId, pointsValue, paidWithPoints } = params;
  const builderNft = await prisma.builderNft.findFirstOrThrow({
    where: {
      id: builderNftId
    }
  });
  const apiClient = getBuilderContractMinterClient();

  // Proceed with minting
  const txResult = await apiClient.mintTo({
    args: {
      account: recipientAddress,
      tokenId: BigInt(builderNft.tokenId),
      amount: BigInt(amount),
      scout: scoutId
    }
  });

  await recordNftMintAndRefreshPrice({ ...params, mintTxHash: txResult.transactionHash });
}
