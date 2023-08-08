import { InvalidInputError } from '@charmverse/core/dist/cjs/errors';
import { stringUtils } from '@charmverse/core/dist/cjs/utilities';
import type { ProposalRubricCriteriaAnswer } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { ProposalRubricCriteriaWithTypedParams } from './interfaces';

export type ProposalRubricData = {
  rubricCriteria: ProposalRubricCriteriaWithTypedParams[];
  rubricAnswers: ProposalRubricCriteriaAnswer[];
};

export async function getProposalRubricData({ proposalId }: { proposalId: string }): Promise<ProposalRubricData> {
  if (!stringUtils.isUUID(proposalId)) {
    throw new InvalidInputError(`Valid proposalId is required`);
  }
  const [criteria, answers] = await Promise.all([
    prisma.proposalRubricCriteria.findMany({ where: { proposalId } }),
    prisma.proposalRubricCriteriaAnswer.findMany({ where: { proposalId } })
  ]);

  return {
    rubricCriteria: criteria as ProposalRubricCriteriaWithTypedParams[],
    rubricAnswers: answers
  };
}
