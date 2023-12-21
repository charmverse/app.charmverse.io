import { log } from '@charmverse/core/log';
import type { ProposalEvaluationResult } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';

import { createVote as createVoteService } from 'lib/votes/createVote';
import type { VoteDTO } from 'lib/votes/interfaces';

import type { VoteSettings } from './interface';

export type ReviewEvaluationRequest = {
  decidedBy: string;
  proposalId: string;
  evaluationId: string;
  result: ProposalEvaluationResult;
};

export async function submitEvaluationResult({ decidedBy, evaluationId, proposalId, result }: ReviewEvaluationRequest) {
  await prisma.$transaction(async (tx) => {
    await tx.proposalEvaluation.update({
      where: {
        id: evaluationId
      },
      data: {
        result,
        decidedBy,
        completedAt: new Date()
      }
    });
    // determine if we should create vote for the next stage
    if (result === 'pass') {
      const evaluations = await tx.proposalEvaluation.findMany({
        where: {
          proposalId
        },
        orderBy: {
          index: 'asc'
        }
      });
      const nextEvaluation = await getCurrentEvaluation(evaluations);
      if (nextEvaluation.type === 'vote') {
        const settings = nextEvaluation.voteSettings as VoteSettings;
        if (!settings.publishToSnapshot) {
          const page = await tx.page.findUniqueOrThrow({
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
            createdBy: decidedBy,
            title: '',
            content: null,
            contentText: '',
            context: 'proposal'
          };
          await createVoteService(newVote);
          log.info('Initiated vote for proposal', { proposalId, spaceId: page.spaceId, pageId: page.id });
        }
      }
    }
  });
}
