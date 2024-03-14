import { prisma } from '@charmverse/core/prisma-client';

import { getTokenAmountOnBlockNumber } from 'lib/snapshot/getTokenAmountOnBlockNumber';

import type { ExtendedVote } from './interfaces';

export async function getVotingPowerForVotes({
  userId,
  votes
}: {
  votes: Pick<ExtendedVote, 'strategy' | 'blockNumber' | 'tokenAddress' | 'chainId'>[];
  userId: string;
}) {
  const userWallets = await prisma.userWallet.findMany({
    where: {
      userId
    },
    select: {
      address: true
    }
  });

  const votingPowers = await Promise.all(
    votes.map((vote) => {
      if (vote.strategy === 'token') {
        if (vote.blockNumber && vote.tokenAddress && userWallets.length && vote.chainId) {
          return getTokenAmountOnBlockNumber({
            blockNumber: vote.blockNumber,
            tokenContractAddress: vote.tokenAddress,
            walletAddress: userWallets[0].address,
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
