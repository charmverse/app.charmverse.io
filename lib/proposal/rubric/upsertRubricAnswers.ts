import { InvalidInputError } from '@charmverse/core/errors';
import type { ProposalRubricCriteriaType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import type {
  ProposalRubricCriteriaAnswerWithTypedResponse,
  ProposalRubricCriteriaWithTypedParams
} from './interfaces';

type RubricAnswerData<T extends ProposalRubricCriteriaType = ProposalRubricCriteriaType> = Pick<
  ProposalRubricCriteriaAnswerWithTypedResponse<T>,
  'rubricCriteriaId' | 'response'
> & { comment?: string };
export type RubricAnswerUpsert = {
  userId: string;
  proposalId: string;
  answers: RubricAnswerData[];
};

export async function upsertRubricAnswers({ answers, userId, proposalId }: RubricAnswerUpsert) {
  if (!stringUtils.isUUID(proposalId)) {
    throw new InvalidInputError(`Valid proposalId is required`);
  } else if (!stringUtils.isUUID(userId)) {
    throw new InvalidInputError(`Valid userId is required`);
  }

  const criteria = (await prisma.proposalRubricCriteria.findMany({
    where: {
      proposalId,
      id: {
        in: answers.map((a) => a.rubricCriteriaId)
      }
    }
  })) as ProposalRubricCriteriaWithTypedParams[];

  for (const answer of answers) {
    const answerCriteria = criteria.find((c) => c.id === answer.rubricCriteriaId);

    if (!answerCriteria) {
      throw new InvalidInputError(`Could not find criteria ${answer.rubricCriteriaId} for proposal ${proposalId}`);
    }
    if (answerCriteria.type === 'range') {
      const parsedScore = parseInt(answer.response.score as any);

      if (
        Number.isNaN(parsedScore) ||
        parsedScore < answerCriteria.parameters.min ||
        parsedScore > answerCriteria.parameters.max
      ) {
        throw new InvalidInputError(`Criteria ${answerCriteria.title} requires a number`);
      }
    }
  }

  return prisma.$transaction([
    prisma.proposalRubricCriteriaAnswer.deleteMany({
      where: {
        proposalId,
        userId
      }
    }),
    prisma.proposalRubricCriteriaAnswer.createMany({
      data: answers.map((a) => ({
        proposalId,
        response: a.response,
        userId,
        comment: a.comment,
        rubricCriteriaId: a.rubricCriteriaId
      }))
    })
  ]);
}
