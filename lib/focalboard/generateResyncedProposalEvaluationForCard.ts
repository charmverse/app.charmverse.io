import type { ProposalEvaluation } from '@charmverse/core/prisma-client';

import type { AnswerData } from 'lib/proposal/rubric/aggregateResults';
import { aggregateResults } from 'lib/proposal/rubric/aggregateResults';

import type { CardPropertyValue } from './card';
import type { ExtractedDatabaseProposalProperties } from './extractDatabaseProposalProperties';

export function generateResyncedProposalEvaluationForCard({
  properties,
  databaseProperties,
  rubricAnswers,
  rubricCriteria,
  currentStep
}: {
  properties: Record<string, CardPropertyValue>;
  databaseProperties: Partial<ExtractedDatabaseProposalProperties>;
  rubricCriteria: { id: string }[];
  rubricAnswers: AnswerData[];
  currentStep: Pick<ProposalEvaluation, 'id' | 'type'>;
}) {
  const cardProperties = JSON.parse(JSON.stringify(properties)) as Record<string, CardPropertyValue>;
  const { allScores, reviewersResults } = aggregateResults({
    answers: rubricAnswers.filter((a) => a.evaluationId === currentStep.id),
    criteria: rubricCriteria.filter((c) => c.id !== currentStep.id)
  });

  const uniqueReviewers = Object.keys(reviewersResults);
  const stringifiedAverage = (allScores.average ?? '').toString();
  const stringifiedSum = (allScores.sum ?? '').toString();

  if (databaseProperties.proposalEvaluationAverage) {
    const propertyValue = cardProperties[databaseProperties.proposalEvaluationAverage.id] as string | string[];
    if (Array.isArray(propertyValue)) {
      propertyValue.push(stringifiedAverage);
    } else if (!propertyValue) {
      cardProperties[databaseProperties.proposalEvaluationAverage.id] = [stringifiedAverage];
    } else {
      cardProperties[databaseProperties.proposalEvaluationAverage.id] = [propertyValue.toString(), stringifiedAverage];
    }
  }

  if (databaseProperties.proposalEvaluationTotal) {
    const propertyValue = cardProperties[databaseProperties.proposalEvaluationTotal.id] as string | string[];
    if (Array.isArray(propertyValue)) {
      propertyValue.push(stringifiedAverage);
    } else if (!propertyValue) {
      cardProperties[databaseProperties.proposalEvaluationTotal.id] = [stringifiedSum];
    } else {
      cardProperties[databaseProperties.proposalEvaluationTotal.id] = [propertyValue.toString(), stringifiedSum];
    }
  }

  if (databaseProperties.proposalEvaluatedBy) {
    const propertyValue = cardProperties[databaseProperties.proposalEvaluatedBy.id] as unknown as string[][];
    if (!propertyValue) {
      cardProperties[databaseProperties.proposalEvaluatedBy.id] = [uniqueReviewers] as any;
    } else {
      cardProperties[databaseProperties.proposalEvaluatedBy.id] = [...propertyValue, uniqueReviewers] as any;
    }
  }

  return cardProperties;
}
