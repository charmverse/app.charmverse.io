import { arrayUtils } from '@charmverse/core/dist/cjs/utilities';
import type { ProposalEvaluationType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { ProposalRubricCriteriaAnswerWithTypedResponse } from 'lib/proposal/rubric/interfaces';

import type { Block } from './block';
import type { Card } from './card';
import type { ExtractedDatabaseProposalProperties } from './extractDatabaseProposalProperties';

export async function generateResyncedEvaluationForSyncedCard({
  proposalId,
  card,
  proposalEvaluationType,
  databaseProperties
}: {
  proposalId: string;
  card: Block;
  proposalEvaluationType: ProposalEvaluationType;
  databaseProperties: ExtractedDatabaseProposalProperties;
}): Promise<Block> {
  if (proposalEvaluationType !== 'rubric') {
    return card;
  }

  const answers = (await prisma.proposalRubricCriteriaAnswer.findMany({
    where: {
      proposalId
    }
  })) as ProposalRubricCriteriaAnswerWithTypedResponse[];

  const groupedByRubric = answers.reduce((acc, val) => {
    if (!acc[val.rubricCriteriaId]) {
      acc[val.rubricCriteriaId] = [];
    }

    acc[val.rubricCriteriaId].push(val);

    return acc;
  }, {} as Record<string, ProposalRubricCriteriaAnswerWithTypedResponse[]>);

  const cardProperties = { ...(card as Card).fields.properties };

  const rubricCriteria = Object.entries(groupedByRubric);

  let total: number = 0;

  for (const [questionId, rubricAnswers] of rubricCriteria) {
    const subtotal = rubricAnswers.reduce(
      (acc, answer) => acc + (!Number.isNaN(parseInt(answer.response.score as any)) ? answer.response.score : 0),
      0
    );
    total += subtotal;
  }

  const average = total / answers.length;

  const uniqueReviewers = arrayUtils.uniqueValues(answers.map((a) => a.userId));

  if (databaseProperties.proposalEvaluationAverage) {
    cardProperties[databaseProperties.proposalEvaluationAverage.id] = average;
  }

  if (databaseProperties.proposalEvaluationTotal) {
    cardProperties[databaseProperties.proposalEvaluationTotal.id] = total;
  }

  if (databaseProperties.proposalEvaluatedBy) {
    cardProperties[databaseProperties.proposalEvaluatedBy.id] = uniqueReviewers;
  }

  return {
    ...card,
    fields: {
      ...card.fields,
      properties: cardProperties
    }
  };
}
