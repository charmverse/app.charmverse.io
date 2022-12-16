import type { Page, Prisma } from '@prisma/client';

import type { IPropertyTemplate } from 'lib/focalboard/board';

import { convertToPlainText } from '../convertToPlainText';
import type { BlocksRecord, GetDatabaseResponse, GetPageResponse } from '../types';

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

export type RegularPageItem = {
  charmversePage?: Page;
  notionPage: {
    topLevelBlockIds: string[];
    blocksRecord: BlocksRecord;
  };
  type: 'page';
};

export type DatabasePageItem = {
  charmversePage?: Page;
  notionPage?: {
    pageIds: string[];
    properties: Record<string, IPropertyTemplate>;
  };
  type: 'database';
};

export class NotionCache {
  notionPagesRecord: Record<string, GetPageResponse | GetDatabaseResponse> = {};

  spaceId: string;

  userId: string;

  charmversePagesRecord: Record<string, CreatePageInput> = {};

  pagesRecord: Map<string, DatabasePageItem | RegularPageItem> = new Map();

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
