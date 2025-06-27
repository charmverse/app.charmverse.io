import type { SmallProposalPermissionFlags } from '@packages/core/permissions';
import { isTruthy } from '@packages/utils/types';

import type { BlockWithDetails } from '../block';
import type { IPropertyTemplate } from '../board';

import type { ProposalCardData } from './getCardProperties';

export function applyPropertiesToCardsAndFilter({
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
  return (
    applyPropertiesToCards({
      blocks,
      boardProperties,
      permissions,
      proposalCards
    })
      // Filter by permissions, but remember to allow normal blocks that do not have a page, like views, to be shown
      .filter((b) => typeof b.syncWithPageId === 'undefined' || !!permissions[b.syncWithPageId]?.view)
  );
}

// apply information from proposals onto the card blocks
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
  return blocks
    .map((block) => {
      if (block.syncWithPageId) {
        const proposalCard = proposalCards[block.syncWithPageId];
        if (proposalCard) {
          const canViewPrivateFields = !!block.syncWithPageId && permissions[block.syncWithPageId].view_private_fields;
          return applyPropertiesToCard({
            boardProperties,
            block,
            proposalProperties: proposalCard,
            canViewPrivateFields
          });
        } else {
          // missing proposal data means proposal is in trash, draft, or archived state
          return null;
        }
      }
      return block;
    })
    .filter(isTruthy);
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
  const filteredProperties = Object.entries(proposalProperties.fields.properties).reduce(
    (acc, [key, value]) => {
      const boardProperty = boardProperties.find((p) => p.id === key);
      if (canViewPrivateFields || !boardProperty?.private) {
        acc[key] = value;
      }
      return acc;
    },
    {} as ProposalCardData['fields']['properties']
  );

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
