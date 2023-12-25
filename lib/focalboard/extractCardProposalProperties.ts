import type { Block, ProposalStatus } from '@charmverse/core/prisma';

import type { ExtractedDatabaseProposalProperties } from './extractDatabaseProposalProperties';

export type ExtractedCardProposalProperties = {
  cardProposalUrl: { propertyId: string; value: string };
  cardProposalCategory: { propertyId: string; optionId: string; value: string };
  cardProposalStatus: { propertyId: string; optionId: string; value: Exclude<ProposalStatus, 'draft'> | 'archived' };
  cardEvaluatedBy: { propertyId: string; value: string[] };
  cardEvaluationTotal: { propertyId: string; value: number };
  cardEvaluationAverage: { propertyId: string; value: number };
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

  const proposalStatusPropertyId = databaseProperties.proposalStatus?.id;
  const proposalStatusValueId = proposalStatusPropertyId ? cardValues[proposalStatusPropertyId] : undefined;

  if (proposalStatusPropertyId && proposalStatusValueId) {
    extractedPropertyValues.cardProposalStatus = {
      propertyId: proposalStatusPropertyId,
      optionId: proposalStatusValueId as string,
      value: databaseProperties.proposalStatus?.options.find((opt) => opt.id === proposalStatusValueId)?.value as  // eslint-disable-next-line prettier/prettier
         (Exclude<ProposalStatus, 'draft'>  | 'archived')
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
