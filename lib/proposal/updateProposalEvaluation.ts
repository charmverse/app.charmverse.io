import { log } from '@charmverse/core/log';
import type { ProposalReviewer, ProposalEvaluationResult } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';

import { createVote as createVoteService } from 'lib/votes';
import type { VoteDTO } from 'lib/votes/interfaces';

import type { VoteSettings } from './interface';

export type UpdateEvaluationRequest = {
  proposalId: string;
  evaluationId: string;
  voteSettings: VoteSettings | null;
  result?: ProposalEvaluationResult | null;
  decidedBy?: string;
  reviewers?: Partial<Pick<ProposalReviewer, 'userId' | 'roleId' | 'systemRole'>>[];
};

export async function updateProposalEvaluation({
  proposalId,
  evaluationId,
  result,
  decidedBy,
  voteSettings,
  reviewers
}: UpdateEvaluationRequest) {
  await prisma.$transaction(async (tx) => {
    // updatereviewers only when it is present in request payload
    if (reviewers) {
      await tx.proposalReviewer.deleteMany({
        where: {
          evaluationId,
          proposalId
        }
      });
      await tx.proposalReviewer.createMany({
        data: reviewers.map((reviewer) => ({
          evaluationId,
          proposalId,
          ...reviewer
        }))
      });
    }
    if (result && decidedBy) {
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
    if (voteSettings) {
      await tx.proposalEvaluation.update({
        where: {
          id: evaluationId
        },
        data: {
          voteSettings
        }
      });
    }
  });
}
