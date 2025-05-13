import { prisma } from '@charmverse/core/prisma-client';
import { getTokenAmountOnBlockNumber } from '@packages/lib/snapshot/getTokenAmountOnBlockNumber';

import type { ExtendedVote } from './interfaces';

export async function getVotingPowerForVotes({
  userId,
  votes
}: {
  votes: Pick<ExtendedVote, 'strategy' | 'blockNumber' | 'tokenAddress' | 'chainId'>[];
  userId: string;
}) {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId
    },
    select: {
      primaryWallet: {
        select: {
          address: true
        }
      },
      wallets: {
        select: {
          address: true
        }
      }
    }
  });

  const primaryWalletAddress = user.primaryWallet?.address ?? user.wallets[0]?.address;

  const votingPowers = await Promise.all(
    votes.map((vote) => {
      if (vote.strategy === 'token') {
        if (vote.blockNumber && vote.tokenAddress && primaryWalletAddress && vote.chainId) {
          return getTokenAmountOnBlockNumber({
            blockNumber: vote.blockNumber,
            tokenContractAddress: vote.tokenAddress,
            walletAddress: primaryWalletAddress,
            chainId: vote.chainId
          });
        }
        return 0;
      }

      return 1;
    })
  );

  return votingPowers;
}
