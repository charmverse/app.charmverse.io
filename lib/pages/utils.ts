import type { Block, PageType, ProposalStatus } from '@charmverse/core/prisma';

import type { DatabaseProposalPropertyType, IPropertyTemplate } from 'lib/focalboard/board';

export function getPagePath() {
  return `page-${Math.random().toString().replace('0.', '')}`;
}

export function canReceiveManualPermissionUpdates({ pageType }: { pageType: PageType }): boolean {
  if (pageType === 'card_template' || pageType === 'proposal') {
    return false;
  }
  return true;
}

export type ExtractedDatabaseProposalProperties = Record<DatabaseProposalPropertyType, IPropertyTemplate>;

/**
 * Returns all proposal properties
 */
export function extractDatabaseProposalProperties({
  database
}: {
  database: Pick<Block, 'fields'>;
}): Partial<ExtractedDatabaseProposalProperties> {
  return {
    proposalCategory: (database.fields as any).cardProperties.find(
      (prop: IPropertyTemplate) => prop.type === 'proposalCategory'
    ),
    proposalUrl: (database.fields as any).cardProperties.find((prop: IPropertyTemplate) => prop.type === 'proposalUrl'),
    proposalStatus: (database.fields as any).cardProperties.find(
      (prop: IPropertyTemplate) => prop.type === 'proposalStatus'
    )
  };
}

export type ExtractedCardProposalProperties = {
  cardProposalUrl: { propertyId: string; value: string };
  cardProposalCategory: { propertyId: string; optionId: string; value: string };
  cardProposalStatus: { propertyId: string; optionId: string; value: Exclude<ProposalStatus, 'draft'> | 'archived' };
};

export function extractCardProposalProperties({
  card,
  databaseProperties
}: {
  card: Pick<Block, 'fields'>;
  databaseProperties: Partial<ExtractedDatabaseProposalProperties>;
}): Partial<ExtractedCardProposalProperties> {
  const cardValues = (card.fields as any).properties as Record<string, string>;

  const extractedPropertyValues: Partial<ExtractedCardProposalProperties> = {};

  const proposalCategoryPropertyId = databaseProperties.proposalCategory?.id;
  const proposalCategoryValueId = proposalCategoryPropertyId ? cardValues[proposalCategoryPropertyId] : undefined;

  if (proposalCategoryPropertyId && proposalCategoryValueId) {
    extractedPropertyValues.cardProposalCategory = {
      propertyId: proposalCategoryPropertyId,
      optionId: proposalCategoryValueId,
      value: databaseProperties.proposalCategory?.options.find((opt) => opt.id === proposalCategoryValueId)?.value ?? ''
    };
  }

  const proposalStatusPropertyId = databaseProperties.proposalStatus?.id;
  const proposalStatusValueId = proposalStatusPropertyId ? cardValues[proposalStatusPropertyId] : undefined;

  if (proposalStatusPropertyId && proposalStatusValueId) {
    extractedPropertyValues.cardProposalStatus = {
      propertyId: proposalStatusPropertyId,
      optionId: proposalStatusValueId,
      value: databaseProperties.proposalStatus?.options.find((opt) => opt.id === proposalStatusValueId)?.value as  // eslint-disable-next-line prettier/prettier
         (Exclude<ProposalStatus, 'draft'>  | 'archived')
    };
  }

  const proposalUrlPropertyId = databaseProperties.proposalUrl?.id;
  const proposalUrlValue = proposalUrlPropertyId ? cardValues[proposalUrlPropertyId] : undefined;

  if (proposalUrlPropertyId && proposalUrlValue) {
    extractedPropertyValues.cardProposalUrl = {
      propertyId: proposalUrlPropertyId,
      value: proposalUrlValue
    };
  }

  return extractedPropertyValues;
}
