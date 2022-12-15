import type { Page, Prisma } from '@prisma/client';

import type { GetDatabaseResponse, GetPageResponse, BlockObjectResponse } from '../types';

type CreatePageInput = {
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

type BlockWithChildren = BlockObjectResponse & { children: string[]; pageId: string };

function convertToPlainText(chunks: { plain_text: string }[]) {
  return chunks.reduce((prev: string, cur: { plain_text: string }) => prev + cur.plain_text, '');
}

export class NotionCache {
  notionPagesRecord: Record<string, GetPageResponse | GetDatabaseResponse> = {};

  spaceId: string;

  userId: string;

  notionPages: (GetPageResponse | GetDatabaseResponse)[] = [];

  charmversePagesRecord: Record<string, CreatePageInput> = {};

  charmverseCardsRecord: Record<
    string,
    {
      card: Prisma.BlockCreateManyInput;
      page: CreatePageInput;
      notionPageId: string;
    }
  > = {};

  blocksRecord: Record<string, BlockWithChildren> = {};

  linkedPages: Record<string, string> = {};

  focalboardRecord: Record<
    string,
    {
      board: Prisma.BlockCreateManyInput;
      view: Prisma.BlockCreateManyInput;
      properties: Record<string, string>;
    }
  > = {};

  pagesWithoutIntegrationAccess: Set<string> = new Set();

  failedImportsRecord: Record<
    string,
    {
      pageId: string;
      type: 'page' | 'database';
      title: string;
      blocks: [string, number][][];
    }
  > = {};

  constructor({ spaceId, userId }: { userId: string; spaceId: string }) {
    this.userId = userId;
    this.spaceId = spaceId;
  }

  populateFailedImportRecord(failedImportBlocks: [string, number][][], block: GetPageResponse | GetDatabaseResponse) {
    let title = '';
    // Database
    if (block.object === 'database') {
      title = convertToPlainText(block.title);
    } else if (block.parent.type === 'database_id') {
      // Focalboard cards
      title = convertToPlainText(
        (Object.values(block.properties).find((property) => property.type === 'title') as any).title
      );
    }
    // Regular page
    else {
      title = convertToPlainText((block.properties.title as any)[block.properties.title.type]);
    }
    return {
      pageId: block.id,
      type: block.object,
      title,
      blocks: failedImportBlocks
    };
  }
}
