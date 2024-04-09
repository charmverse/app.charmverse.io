import type { Block } from '@charmverse/core/prisma';

import type { ProposalEvaluationResultExtended, ProposalEvaluationStatus } from 'lib/proposals/interfaces';

import type { CardFields, CardPropertyValue } from '../card';

import type { ProposalPropertiesMap } from './getProposalSourceProperties';

export type ExtractedCardProposalProperties = {
  cardProposalUrl: { propertyId: string; value: string };
  cardProposalStatus: { propertyId: string; optionId: string; value: ProposalEvaluationStatus };
  cardEvaluationType: { propertyId: string; value: ProposalEvaluationResultExtended; optionId: string };
  cardProposalStep: { propertyId: string; optionId: string; value: string };
  cardProposalAuthor: { propertyId: string; value: string[] };
};

export function getCardPropertiesFromProposal({
  card,
  databaseProperties
}: {
  card: Pick<Block, 'fields'>;
  databaseProperties: Partial<ProposalPropertiesMap>;
}): Partial<ExtractedCardProposalProperties> {
  const cardValues = (card.fields as CardFields).properties as Record<string, CardPropertyValue>;

  const extractedPropertyValues: Partial<ExtractedCardProposalProperties> = {};

  const proposalEvaluationTypePropertyId = databaseProperties.proposalEvaluationType?.id;
  const proposalAuthorPropertyId = databaseProperties.proposalAuthor?.id;
  const proposalEvaluationTypeValueId = proposalEvaluationTypePropertyId
    ? cardValues[proposalEvaluationTypePropertyId]
    : undefined;

  if (proposalAuthorPropertyId) {
    extractedPropertyValues.cardProposalAuthor = {
      propertyId: proposalAuthorPropertyId,
      value: cardValues[proposalAuthorPropertyId] as string[]
    };
  }

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

  return extractedPropertyValues;
}
