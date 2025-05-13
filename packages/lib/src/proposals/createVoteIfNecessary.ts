import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import { createVote as createVoteService } from '@packages/lib/votes/createVote';
import type { VoteDTO } from '@packages/lib/votes/interfaces';

import type { VoteSettings } from './interfaces';

export async function createVoteIfNecessary({ createdBy, proposalId }: { createdBy: string; proposalId: string }) {
  const evaluations = await prisma.proposalEvaluation.findMany({
    where: {
      proposalId
    },
    orderBy: {
      index: 'asc'
    }
  });
  const nextEvaluation = getCurrentEvaluation(evaluations);
  if (nextEvaluation?.type === 'vote') {
    const settings = nextEvaluation.voteSettings as VoteSettings;
    if (settings.strategy !== 'snapshot') {
      const page = await prisma.page.findUniqueOrThrow({
        where: { proposalId },
        select: { id: true, spaceId: true }
      });
      const newVote: VoteDTO = {
        evaluationId: nextEvaluation.id,
        pageId: page.id,
        spaceId: page.spaceId,
        voteOptions: settings.options,
        type: settings.type,
        threshold: settings.threshold,
        maxChoices: settings.maxChoices,
        deadline: new Date(Date.now() + settings.durationDays * 24 * 60 * 60 * 1000),
        createdBy,
        title: '',
        content: null,
        contentText: '',
        context: 'proposal',
        strategy: settings.strategy,
        blockNumber: settings.blockNumber ?? undefined,
        chainId: settings.chainId ?? undefined,
        tokenAddress: settings.tokenAddress ?? undefined
      };
      await createVoteService(newVote);
      log.info('Initiated vote for proposal', { proposalId, spaceId: page.spaceId, pageId: page.id });
    }
  }
}
