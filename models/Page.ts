import type { Page } from '@prisma/client';

export { Page };

export const PATH_BLACKLIST = ['settings'];

export type PageType = 'page' | 'board';

export interface PagePermission {
  pageId: string;
  userId: string;
  level: 'full_access' | 'editor' | 'view_comment' | 'view';
}

interface TextContent {
  text: string
  type: 'text'
}

interface PageMark {
  type: string
  attrs?: Record<string, any>
}

export interface PageContent {
  [key: string]: any,
  type: string,
  content?: (PageContent | TextContent)[],
  attrs?: Record<string, any>
  marks?: PageMark[]
}
