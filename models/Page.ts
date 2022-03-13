import type { Page } from '@prisma/client';

export { Page };

export const PATH_BLACKLIST = ['settings'];

export type PageType = 'page' | 'board';

export interface PagePermission {
  pageId: string;
  userId: string;
  level: 'full_access' | 'editor' | 'view_comment' | 'view';
}

export interface TextMark {
  type: string
  attrs?: Record<string, any>
}

export interface TextContent {
  text: string
  type: 'text'
  marks?: TextMark[]
}

export interface TableHeaderNode {
  type: 'table_header',
  content: TextContent[]
}

export interface TableCellNode {
  type: 'table_cell',
  content: TextContent[]
}

export interface TableRowNode {
  type: 'table_row',
  content: (TableHeaderNode | TableCellNode)[]
}

export interface TableNode {
  type: 'table'
  content: TableRowNode[]
}

export interface PageContent {
  [key: string]: any,
  type: string,
  content?: (PageContent | TextContent)[],
  attrs?: Record<string, any>
}
