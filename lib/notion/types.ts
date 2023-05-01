import type { Page, Prisma } from '@charmverse/core/dist/prisma';
import type { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export type BaseApiColor = 'gray' | 'turquoise' | 'orange' | 'yellow' | 'teal' | 'blue' | 'purple' | 'pink' | 'red';
export type ApiColor = 'default' & BaseApiColor & `${BaseApiColor}_background`;

export interface FailedImportsError {
  pageId: string;
  type: 'page' | 'database';
  title: string;
  blocks: [string, number][][];
}

export type CreatePageInput = {
  id: string;
  content?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
  headerImage?: string | null;
  icon?: string | null;
  spaceId: string;
  title: string;
  type?: Page['type'];
  createdBy: string;
  boardId?: string;
  parentId?: string | null;
  cardId?: string;
};

export interface ChildBlockListResponse {
  parent_block_id: string;
  results: BlockObjectResponse[];
  next_cursor: string | null;
}

export type BlockWithChildren = BlockObjectResponse & { children: string[]; has_children: boolean };
export type BlocksRecord = Record<string, BlockWithChildren>;
