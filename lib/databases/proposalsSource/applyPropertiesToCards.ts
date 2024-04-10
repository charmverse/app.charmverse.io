import type { SmallProposalPermissionFlags } from '@charmverse/core/permissions';

import type { BlockWithDetails } from '../block';
import type { IPropertyTemplate } from '../board';

import type { ProposalCardData } from './getCardProperties';

export function applyPropertiesToCards({
  blocks,
  boardProperties,
  permissions,
  proposalCards
}: {
  boardProperties: IPropertyTemplate[];
  blocks: BlockWithDetails[];
  permissions: Record<string, SmallProposalPermissionFlags>;
  proposalCards: Record<string, ProposalCardData>;
}): BlockWithDetails[] {
  return blocks.map((block) => {
    const proposalCard = !!block.syncWithPageId && proposalCards[block.syncWithPageId];
    if (proposalCard) {
      const canViewPrivateFields = !!block.syncWithPageId && permissions[block.syncWithPageId].view_private_fields;
      return applyPropertiesToCard({
        boardProperties,
        block,
        proposalProperties: proposalCard,
        canViewPrivateFields
      });
    }
    return block;
  });
}

export function applyPropertiesToCard({
  boardProperties,
  block,
  proposalProperties,
  canViewPrivateFields
}: {
  boardProperties: IPropertyTemplate[];
  block: BlockWithDetails;
  proposalProperties: ProposalCardData;
  canViewPrivateFields: boolean;
}) {
  const filteredProperties = Object.entries(proposalProperties.fields.properties).reduce((acc, [key, value]) => {
    const boardProperty = boardProperties.find((p) => p.id === key);
    if (canViewPrivateFields || !boardProperty?.private) {
      acc[key] = value;
    }
    return acc;
  }, {} as ProposalCardData['fields']['properties']);

  const properties = {
    ...block.fields.properties,
    ...filteredProperties
  };
  return {
    ...block,
    title: proposalProperties.title,
    fields: {
      ...block.fields,
      properties
    }
  };
}
