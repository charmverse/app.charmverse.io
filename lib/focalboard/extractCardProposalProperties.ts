import type { Block } from '@charmverse/core/prisma';

import type { ProposalEvaluationResultExtended, ProposalEvaluationStatus } from 'lib/proposal/interface';

import type { ExtractedDatabaseProposalProperties } from './extractDatabaseProposalProperties';

export type ExtractedCardProposalProperties = {
  cardProposalUrl: { propertyId: string; value: string };
  cardProposalStatus: { propertyId: string; optionId: string; value: ProposalEvaluationStatus };
  cardEvaluatedBy: { propertyId: string; value: string[] };
  cardEvaluationTotal: { propertyId: string; value: number };
  cardEvaluationAverage: { propertyId: string; value: number };
  cardEvaluationType: { propertyId: string; value: ProposalEvaluationResultExtended; optionId: string };
  cardProposalStep: { propertyId: string; optionId: string; value: string };
};

export function extractCardProposalProperties({
  card,
  databaseProperties
}: {
  card: Pick<Block, 'fields'>;
  databaseProperties: Partial<ExtractedDatabaseProposalProperties>;
}): Partial<ExtractedCardProposalProperties> {
  const cardValues = (card.fields as any).properties as Record<string, string | number | string[]>;

  const extractedPropertyValues: Partial<ExtractedCardProposalProperties> = {};

  const proposalEvaluationTypePropertyId = databaseProperties.proposalEvaluationType?.id;
  const proposalEvaluationTypeValueId = proposalEvaluationTypePropertyId
    ? cardValues[proposalEvaluationTypePropertyId]
    : undefined;

  if (proposalEvaluationTypePropertyId) {
    extractedPropertyValues.cardEvaluationType = {
      propertyId: proposalEvaluationTypePropertyId,
      optionId: proposalEvaluationTypeValueId as string,
      value: databaseProperties.proposalEvaluationType?.options.find((opt) => opt.id === proposalEvaluationTypeValueId)
        ?.value as ProposalEvaluationResultExtended
    };
  }

  const proposalStatusPropertyId = databaseProperties.proposalStatus?.id;
  const proposalStatusValueId = proposalStatusPropertyId ? cardValues[proposalStatusPropertyId] : undefined;

  if (proposalStatusPropertyId) {
    extractedPropertyValues.cardProposalStatus = {
      propertyId: proposalStatusPropertyId,
      optionId: proposalStatusValueId as string,
      value: databaseProperties.proposalStatus?.options.find((opt) => opt.id === proposalStatusValueId)
        ?.value as ProposalEvaluationStatus
    };
  }

  const proposalStepPropertyId = databaseProperties.proposalStep?.id;
  const proposalStepValueId = proposalStepPropertyId ? cardValues[proposalStepPropertyId] : undefined;

  if (proposalStepPropertyId) {
    extractedPropertyValues.cardProposalStep = {
      propertyId: proposalStepPropertyId,
      optionId: proposalStepValueId as string,
      value: databaseProperties.proposalStep?.options.find((opt) => opt.id === proposalStepValueId)
        ?.value as ProposalEvaluationStatus
    };
  }

  const proposalUrlPropertyId = databaseProperties.proposalUrl?.id;
  const proposalUrlValue = proposalUrlPropertyId ? cardValues[proposalUrlPropertyId] : undefined;

  if (proposalUrlPropertyId && proposalUrlValue) {
    extractedPropertyValues.cardProposalUrl = {
      propertyId: proposalUrlPropertyId,
      value: proposalUrlValue as string
    };
  }

  // Rubric criteria
  const proposalEvaluatedById = databaseProperties.proposalEvaluatedBy?.id;
  if (proposalEvaluatedById) {
    extractedPropertyValues.cardEvaluatedBy = {
      propertyId: proposalEvaluatedById,
      value: cardValues[proposalEvaluatedById] as string[]
    };
  }

  const proposalEvaluationTotalId = databaseProperties.proposalEvaluationTotal?.id;
  if (proposalEvaluationTotalId) {
    extractedPropertyValues.cardEvaluationTotal = {
      propertyId: proposalEvaluationTotalId,
      value: cardValues[proposalEvaluationTotalId] as number
    };
  }

  const proposalEvaluationAverageId = databaseProperties.proposalEvaluationAverage?.id;
  if (proposalEvaluationAverageId) {
    extractedPropertyValues.cardEvaluationAverage = {
      propertyId: proposalEvaluationAverageId,
      value: cardValues[proposalEvaluationAverageId] as number
    };
  }

  return extractedPropertyValues;
}
