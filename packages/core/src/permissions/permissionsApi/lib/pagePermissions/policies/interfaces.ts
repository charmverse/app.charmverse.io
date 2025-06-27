import type { Bounty, Page } from '@charmverse/core/prisma';
import type { PagePermissionFlags, PermissionFilteringPolicyFnInput } from '@packages/core/permissions';

export type PageResource = Pick<
  Page,
  'id' | 'proposalId' | 'convertedProposalId' | 'type' | 'createdBy' | 'spaceId' | 'parentId' | 'isLocked'
> & {
  bounty?: Pick<Bounty, 'createdBy' | 'spaceId' | 'status'> | null;
};
export type PagePolicyInput = PermissionFilteringPolicyFnInput<PageResource, PagePermissionFlags>;
