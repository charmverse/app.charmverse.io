import type {
  Block,
  Bounty,
  BountyPermission,
  Page,
  Proposal,
  ProposalAuthor,
  ProposalReviewer,
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
  proposal?: Proposal & { authors: ProposalAuthor[]; reviewers: ProposalReviewer[] };
  bounty?: Bounty & { permissions: BountyPermission[] };
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
