import type {
  Block,
  Bounty,
  BountyPermission,
  Page,
  Proposal,
  ProposalCategory,
  ProposalCategoryPermission,
  Vote,
  VoteOptions
} from '@prisma/client';

import type { PageNodeWithChildren } from 'lib/pages';

export interface PageWithBlocks {
  blocks: {
    board?: Block;
    views?: Block[];
    card?: Block;
  };
  votes?: (Vote & { voteOptions: VoteOptions[] })[];
  proposal?:
    | (Proposal & {
        category: null | (ProposalCategory & { proposalCategoryPermissions: ProposalCategoryPermission[] });
      })
    | null;
  bounty?: (Bounty & { permissions: BountyPermission[] }) | null;
  // eslint-disable-next-line
  inlineDatabases?: ExportedPage[];
}

export type ExportedPage = PageNodeWithChildren<Page & Partial<PageWithBlocks>>;

export interface WorkspaceExport {
  pages: ExportedPage[];
}

export interface WorkspaceImport {
  exportData?: WorkspaceExport;
  exportName?: string;
  targetSpaceIdOrDomain: string;
  // Parent id of root pages, could be another page or null if space is parent
  parentId?: string | null;
  updateTitle?: boolean;
}
