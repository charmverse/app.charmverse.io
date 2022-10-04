import type { Block } from '@prisma/client';

import type { IPageWithPermissions, PageNodeWithChildren } from 'lib/pages';

export interface PageWithBlocks {
  blocks: {
    board?: Block;
    views?: Block[];
    card?: Block;
  };
}

export type ExportedPage = PageNodeWithChildren<IPageWithPermissions & Partial<PageWithBlocks>>

export interface WorkspaceExport {
  pages: ExportedPage[];
}

export interface WorkspaceImport {
  exportData?: WorkspaceExport;
  exportName?: string;
  targetSpaceIdOrDomain: string;
}
