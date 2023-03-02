import type { Block, Page } from '@prisma/client';

import type { IPageWithPermissions, PageNodeWithChildren } from 'lib/pages';

export interface PageWithBlocks {
  blocks: {
    board?: Block;
    views?: Block[];
    card?: Block;
  };
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
  skipBounties?: boolean;
  skipProposals?: boolean;
}
