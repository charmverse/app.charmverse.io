'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { BuilderNFTSeasonOneClient } from '@packages/scoutgame/builderNfts/builderNFTSeasonOneClient';
import { builderContractAddress, builderNftChain } from '@packages/scoutgame/builderNfts/constants';
import { getScoutGameNftAdminWallet } from '@packages/scoutgame/builderNfts/getScoutGameNftAdminWallet';
import { refreshBuilderNftPrice } from '@packages/scoutgame/builderNfts/refreshBuilderNftPrice';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';

export async function handlePendingTransaction({
  pendingTransactionId
}: {
  pendingTransactionId: string;
}): Promise<void> {
  const pendingTx = await prisma.pendingNftTransaction.findUniqueOrThrow({
    where: {
      id: pendingTransactionId
    }
  });

  const builderNft = await prisma.builderNft.findFirstOrThrow({
    where: {
      chainId: pendingTx.destinationChainId,
      contractAddress: pendingTx.contractAddress
    }
  });

  const serverClient = getScoutGameNftAdminWallet();

  const apiClient = new BuilderNFTSeasonOneClient({
    chain: builderNftChain,
    contractAddress: builderContractAddress,
    walletClient: serverClient
  });

  const txResult = await apiClient.mintTo({
    args: {
      account: pendingTx.senderAddress,
      tokenId: pendingTx.tokenId,
      amount: pendingTx.targetAmountReceived,
      scout: pendingTx.userId
    }
  });

  await prisma.nFTPurchaseEvent.create({
    data: {
      // Assuming constant conversion rate of 4:1, and 6 decimals on USDC
      pointsValue: 0,
      tokensPurchased: pendingTx.tokenAmount,
      txHash: txResult.transactionHash,
      builderNftId: builderNft.id,
      scoutId: pendingTx.userId,
      builderEvent: {
        create: {
          type: 'nft_purchase',
          season: currentSeason,
          week: getCurrentWeek(),
          builder: {
            connect: {
              id: pendingTx.userId
            }
          }
        }
      },
      activities: {
        create: {
          recipientType: 'builder',
          type: 'nft_purchase',
          userId: builderNft.builderId
        }
      }
    },
    include: {}
  });

  // const pointsValue = Number(nextPrice) / 5;

  await refreshBuilderNftPrice({ builderId: builderNft.builderId, season: currentSeason });
}
