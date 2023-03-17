import type {
  Block,
  Bounty,
  BountyPermission,
  Page,
  PagePermission,
  Proposal,
  ProposalCategory,
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
        category: null | ProposalCategory;
      })
    | null;
  bounty?: (Bounty & { permissions: BountyPermission[] }) | null;
  // eslint-disable-next-line
  inlineDatabases?: ExportedPage[];
}

export type ExportedPage = PageNodeWithChildren<
  Page & Partial<PageWithBlocks> & { permissions: (PagePermission & { sourcePermission?: PagePermission | null })[] }
>;

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
