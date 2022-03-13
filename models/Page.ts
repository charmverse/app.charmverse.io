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

export interface ParagraphNode {
  type: 'paragraph',
  content: (ParagraphNode | TextContent)[]
}

export interface ListItemNode {
  attrs: {todoChecked?: null | boolean}
  type: 'listItem',
  // eslint-disable-next-line
  content: (ParagraphNode | BulletListNode)[]
}

export interface BulletListNode {
  type: 'bulletList',
  content: ListItemNode[]
  attrs?: {tight?: boolean}
}

export interface OrderedListNode {
  type: 'orderedList',
  content: ListItemNode[]
  attrs?: {tight?: boolean}
}

export interface CalloutNode {
  type: 'blockquote',
  // eslint-disable-next-line
  content?: BlockNode[],
  attrs?: {
    emoji: string | null
  }
}

export interface PageContent {
  [key: string]: any,
  type: string,
  // eslint-disable-next-line
  content?: BlockNode[],
  attrs?: Record<string, any>
}

export type BlockNode = TableHeaderNode | TableCellNode | TableRowNode | TableNode |
  ParagraphNode | ListItemNode | BulletListNode | PageContent | OrderedListNode;
