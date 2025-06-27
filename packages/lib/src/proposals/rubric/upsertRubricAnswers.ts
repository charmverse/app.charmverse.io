import type { ProposalRubricCriteriaType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/core/errors';
import { stringUtils } from '@packages/core/utilities';

import { setPageUpdatedAt } from '../setPageUpdatedAt';

import { getAnswersTable } from './getAnswersTable';
import type { ProposalRubricCriteriaAnswerWithTypedResponse, RubricCriteriaTyped } from './interfaces';

export type RubricAnswerData<T extends ProposalRubricCriteriaType = ProposalRubricCriteriaType> = Pick<
  ProposalRubricCriteriaAnswerWithTypedResponse<T>,
  'rubricCriteriaId' | 'response'
> & { comment?: string };

export type RubricAnswerUpsert = {
  isDraft?: boolean;
  userId: string;
  proposalId: string;
  evaluationId: string;
  answers: RubricAnswerData[];
};

export async function upsertRubricAnswers({ answers, userId, proposalId, evaluationId, isDraft }: RubricAnswerUpsert) {
  if (!stringUtils.isUUID(proposalId)) {
    throw new InvalidInputError(`Valid proposalId is required`);
  } else if (!stringUtils.isUUID(userId)) {
    throw new InvalidInputError(`Valid userId is required`);
  } else if (answers.find((a) => typeof (a.response as any).score !== 'number')) {
    throw new InvalidInputError(`Enter a valid score for all the questions`);
  }

  const criteria = (await prisma.proposalRubricCriteria.findMany({
    where: {
      proposalId,
      evaluationId,
      id: {
        in: answers.map((a) => a.rubricCriteriaId)
      }
    }
  })) as RubricCriteriaTyped[];

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
        throw new InvalidInputError(`Enter a valid score for: ${answerCriteria.title}`);
      }
    }
  }

  const table = getAnswersTable({ isDraft });

  return prisma.$transaction([
    table.deleteMany({
      where: {
        proposalId,
        evaluationId,
        userId
      }
    }),
    table.createMany({
      data: answers.map((a) => ({
        proposalId,
        evaluationId,
        response: a.response,
        userId,
        comment: a.comment,
        rubricCriteriaId: a.rubricCriteriaId
      }))
    }),
    setPageUpdatedAt({ proposalId, userId })
  ]);
}
