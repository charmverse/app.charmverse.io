import type { ProposalEvaluationType } from '@charmverse/core/prisma-client';

import type { AnswerData } from 'lib/proposal/rubric/aggregateResults';
import { aggregateResults } from 'lib/proposal/rubric/aggregateResults';

import type { Block } from './block';
import type { Card } from './card';
import type { ExtractedDatabaseProposalProperties } from './extractDatabaseProposalProperties';

export function generateResyncedProposalEvaluationForCard({
  cardProps,
  proposalEvaluationType,
  databaseProperties,
  rubricAnswers,
  rubricCriteria
}: {
  cardProps: Pick<Block, 'fields'>;
  proposalEvaluationType: ProposalEvaluationType;
  databaseProperties: Partial<ExtractedDatabaseProposalProperties>;
  rubricCriteria: { id: string }[];
  rubricAnswers: AnswerData[];
}): Pick<Block, 'fields'> {
  if (proposalEvaluationType !== 'rubric') {
    return cardProps;
  }

  const cardProperties = { ...(cardProps as Card).fields.properties };

  const { allScores, reviewersResults } = aggregateResults({
    answers: rubricAnswers,
    criteria: rubricCriteria
  });

  const uniqueReviewers = Object.keys(reviewersResults);

  if (databaseProperties.proposalEvaluationAverage) {
    cardProperties[databaseProperties.proposalEvaluationAverage.id] = allScores.average ?? '';
  }

  if (databaseProperties.proposalEvaluationTotal) {
    cardProperties[databaseProperties.proposalEvaluationTotal.id] = allScores.sum ?? '';
  }

  if (databaseProperties.proposalEvaluatedBy) {
    cardProperties[databaseProperties.proposalEvaluatedBy.id] = uniqueReviewers;
  }

  return {
    fields: {
      ...cardProps.fields,
      properties: cardProperties
    }
  };
}
