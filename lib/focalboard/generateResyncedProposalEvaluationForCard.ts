import type { ProposalEvaluation } from '@charmverse/core/prisma-client';

import type { AnswerData } from 'lib/proposal/rubric/aggregateResults';
import { aggregateResults } from 'lib/proposal/rubric/aggregateResults';

import type { Block } from './block';
import type { Card } from './card';
import type { ExtractedDatabaseProposalProperties } from './extractDatabaseProposalProperties';

export function generateResyncedProposalEvaluationForCard({
  cardProps,
  databaseProperties,
  rubricAnswers,
  rubricCriteria,
  currentStep
}: {
  cardProps: Pick<Block, 'fields'>;
  databaseProperties: Partial<ExtractedDatabaseProposalProperties>;
  rubricCriteria: { id: string }[];
  rubricAnswers: AnswerData[];
  currentStep: Pick<ProposalEvaluation, 'id' | 'type'>;
}): Pick<Block, 'fields'> {
  const cardProperties = { ...(cardProps as Card).fields.properties };

  if (currentStep?.type === 'rubric') {
    const { allScores, reviewersResults } = aggregateResults({
      answers: rubricAnswers.filter((a) => a.evaluationId === currentStep.id),
      criteria: rubricCriteria.filter((c) => c.id !== currentStep.id)
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
  }
  return {
    fields: {
      ...cardProps.fields,
      properties: cardProperties
    }
  };
}
