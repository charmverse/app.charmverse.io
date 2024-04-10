import type { SmallProposalPermissionFlags } from '@charmverse/core/permissions';

import type { BlockWithDetails } from '../block';

import type { ProposalCardData } from './getCardProperties';

export function applyPropertiesToCards({
  blocks,
  permissions,
  proposalCards
}: {
  blocks: BlockWithDetails[];
  permissions: Record<string, SmallProposalPermissionFlags>;
  proposalCards: Record<string, ProposalCardData>;
}): BlockWithDetails[] {
  return blocks.map((block) => {
    const proposalCard = !!block.syncWithPageId && proposalCards[block.syncWithPageId];
    if (proposalCard) {
      const canViewPrivateFields = !!block.syncWithPageId && permissions[block.syncWithPageId].view_private_fields;
      return applyPropertiesToCard({
        block,
        proposalProperties: proposalCard,
        canViewPrivateFields
      });
    }
    return block;
  });
}

export function applyPropertiesToCard({
  block,
  proposalProperties,
  canViewPrivateFields
}: {
  block: BlockWithDetails;
  proposalProperties: ProposalCardData;
  canViewPrivateFields: boolean;
}) {
  const accessPrivateFields = !!block.syncWithPageId && canViewPrivateFields;

  // TODO: filter private answers if user does not have access
  // const formFieldProperties = getCardPropertiesFromForm({
  //   accessPrivateFields,
  //   cardProperties: boardBlockCardProperties,
  //   formFields,
  //   proposalId: pageProposal.proposal!.id
  // });
  const properties = {
    ...block.fields.properties,
    ...proposalProperties.fields.properties
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
