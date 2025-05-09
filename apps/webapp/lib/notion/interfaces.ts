import type { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export type BaseApiColor =
  | 'gray'
  | 'turquoise'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'red';
export type ApiColor = 'default' & BaseApiColor & `${BaseApiColor}_background`;

export interface FailedImportsError {
  pageId: string;
  type: 'page' | 'database';
  title: string;
  blocks: [string, string][];
}

export interface ChildBlockListResponse {
  parent_block_id: string;
  results: BlockObjectResponse[];
  next_cursor: string | null;
}

export type BlockWithChildren = BlockObjectResponse & { children: string[]; has_children: boolean };
export type BlocksRecord = Record<string, BlockWithChildren>;
