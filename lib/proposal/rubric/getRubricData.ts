import { InvalidInputError } from '@charmverse/core/errors';
import type { ProposalRubricCriteriaAnswer, DraftProposalRubricCriteriaAnswer } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import type { ProposalRubricCriteriaWithTypedParams } from './interfaces';

export type ProposalRubricData = {
  rubricCriteria: ProposalRubricCriteriaWithTypedParams[];
  rubricAnswers: ProposalRubricCriteriaAnswer[];
  draftRubricAnswers: DraftProposalRubricCriteriaAnswer[];
};

export async function getProposalRubricData({ proposalId }: { proposalId: string }): Promise<ProposalRubricData> {
  if (!stringUtils.isUUID(proposalId)) {
    throw new InvalidInputError(`Valid proposalId is required`);
  }
  const [criteria, answers, draftAnswers] = await Promise.all([
    prisma.proposalRubricCriteria.findMany({ where: { proposalId } }),
    prisma.proposalRubricCriteriaAnswer.findMany({ where: { proposalId } }),
    prisma.draftProposalRubricCriteriaAnswer.findMany({ where: { proposalId } })
  ]);

  return {
    rubricCriteria: criteria as ProposalRubricCriteriaWithTypedParams[],
    rubricAnswers: answers,
    draftRubricAnswers: draftAnswers
  };
}
