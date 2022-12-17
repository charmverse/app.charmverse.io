import type { DatabaseObjectResponse, PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import type { Page } from '@prisma/client';

import type { IPropertyTemplate } from 'lib/focalboard/board';

import { convertToPlainText } from '../convertToPlainText';
import type { BlocksRecord, CreatePageInput } from '../types';

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
  notionPagesRecord: Record<string, PageObjectResponse | DatabaseObjectResponse> = {};

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

  populateFailedImportRecord(
    failedImportBlocks: [string, number][][],
    block: PageObjectResponse | DatabaseObjectResponse
  ) {
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
