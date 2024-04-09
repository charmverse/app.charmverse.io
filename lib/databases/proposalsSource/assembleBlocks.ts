import type { SmallProposalPermissionFlags } from '@charmverse/core/permissions';

import type { BlockWithDetails } from '../block';

import type { ProposalCardData } from './getProposalsAsCards';

export function assembleBlocks({
  blocks,
  permissions,
  proposalCards
}: {
  blocks: BlockWithDetails[];
  permissions: Record<string, SmallProposalPermissionFlags>;
  proposalCards: Record<string, ProposalCardData>;
}): BlockWithDetails[] {
  return blocks;
}
