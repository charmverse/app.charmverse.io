import type { SmallProposalPermissionFlags } from '@charmverse/core/permissions';

import type { BlockWithDetails } from '../block';

import type { ProposalCardData } from './getCardPropertiesFromProposals';

export function assembleBlocks({
  blocks,
  permissions,
  proposalCards
}: {
  blocks: BlockWithDetails[];
  permissions: Record<string, SmallProposalPermissionFlags>;
  proposalCards: Record<string, ProposalCardData>;
}): BlockWithDetails[] {
  return blocks.map((block) => {
    const proposalCard = block.syncWithPageId && proposalCards[block.syncWithPageId];
    if (proposalCard) {
      const mergedProperties = {
        ...block.fields.properties,
        ...proposalCard.fields.properties
      };

      const accessPrivateFields = !!block.syncWithPageId && permissions[block.syncWithPageId].view_private_fields;

      // TODO: filter private answers if user does not have access
      // const formFieldProperties = getCardPropertiesFromAnswers({
      //   accessPrivateFields,
      //   cardProperties: boardBlockCardProperties,
      //   formFields,
      //   proposalId: pageProposal.proposal!.id
      // });
      return {
        ...block,
        fields: {
          ...block.fields,
          properties: mergedProperties
        }
      };
    }
    return block;
  });
}
