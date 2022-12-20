import type { DatabaseObjectResponse, PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import type { Page } from '@prisma/client';

import type { IPropertyTemplate } from 'lib/focalboard/board';

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
      blocks: [string, string][];
    }
  > = {};

  // key: blockId, value: pageId
  blockPageIdRecord: Map<string, string> = new Map();
}
