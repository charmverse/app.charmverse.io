/* eslint-disable no-use-before-define */

export type BlockNode =
  | TableHeaderNode
  | TableCellNode
  | TableRowNode
  | TableNode
  | CodeNode
  | ParagraphNode
  | ListItemNode
  | BulletListNode
  | PageContent
  | OrderedListNode
  | QuoteNode;

export interface PagePermission {
  pageId: string;
  userId: string;
  level: 'full_access' | 'editor' | 'view_comment' | 'view';
}

export interface TextMark {
  type: string;
  attrs?: Record<string, any>;
}

export interface TextContent {
  text: string;
  type: 'text';
  marks?: TextMark[];
}

export interface MentionNode {
  type: 'mention';
  attrs: {
    type: 'user' | 'page';
    value: string;
  };
}

export interface TableHeaderNode {
  type: 'table_header';
  content: (TextContent | MentionNode)[];
}

export interface HeadingNode {
  type: 'heading';
  content: (TextContent | MentionNode)[];
  attrs: {
    level: number;
  };
}

export interface TableCellNode {
  type: 'table_cell';
  content: (TextContent | MentionNode)[];
}

export interface TableRowNode {
  type: 'table_row';
  content: (TableHeaderNode | TableCellNode)[];
}

export interface TableNode {
  type: 'table';
  content: TableRowNode[];
}

export interface ParagraphNode {
  type: 'paragraph';
  content: (ParagraphNode | TextContent | MentionNode)[];
}

export interface DisclosureSummaryNode {
  type: 'disclosureSummary';
  content: (ParagraphNode | HeadingNode)[];
}
export interface DisclosureDetailsNode {
  type: 'disclosureDetails';
  content: [DisclosureSummaryNode, ...(ParagraphNode | TextContent | MentionNode)[]];
}

export interface ListItemNode {
  attrs: { todoChecked?: null | boolean };
  type: 'list_item';
  // eslint-disable-next-line
  content: (ParagraphNode | BulletListNode)[];
}

export interface ColumnBlockNode {
  type: 'columnBlock';
  // eslint-disable-next-line
  content: ParagraphNode[];
}

export interface ColumnLayoutNode {
  type: 'columnLayout';
  content: ColumnBlockNode[];
}

export interface BulletListNode {
  type: 'bullet_list';
  content: ListItemNode[];
  attrs?: { tight?: boolean };
}

export interface OrderedListNode {
  type: 'ordered_list';
  content: ListItemNode[];
  attrs?: { tight?: boolean };
}

export interface CalloutNode {
  type: 'blockquote';
  content?: BlockNode[];
  attrs?: {
    emoji: string | null;
  };
}

export interface QuoteNode {
  type: 'quote';
  content: BlockNode[];
}

export interface PageContent {
  [key: string]: any;
  type: string;
  content?: BlockNode[];
  attrs?: Record<string, any>;
}

export interface CodeNode {
  type: 'codeBlock';
  content: TextContent[];
  attrs: {
    language: string;
  };
}
