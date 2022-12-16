import { Client } from '@notionhq/client';

import { NotionCache } from './NotionCache';
import { NotionPageFetcher } from './NotionPageFetcher';

export class NotionImporter {
  cache: NotionCache;

  client: Client;

  userId: string;

  spaceId: string;

  fetcher: NotionPageFetcher;

  constructor({
    blocksPerRequest = 100,
    totalImportedPagesLimit = 10000,
    maxChildBlockDepth = 10,
    spaceId,
    userId,
    accessToken
  }: {
    userId: string;
    spaceId: string;
    accessToken: string;
    maxChildBlockDepth?: number;
    blocksPerRequest?: number;
    totalImportedPagesLimit?: number;
  }) {
    const client = new Client({
      auth: accessToken
    });
    const notionCache = new NotionCache();
    const notionPageFetcher = new NotionPageFetcher({
      blocksPerRequest,
      maxChildBlockDepth,
      totalImportedPagesLimit,
      client,
      cache: notionCache,
      spaceId,
      userId
    });

    this.cache = notionCache;
    this.fetcher = notionPageFetcher;
    this.client = client;
    this.userId = userId;
    this.spaceId = spaceId;
  }

  /**
   * Fetch accessible notion pages
   */
  async import({ workspaceIcon, workspaceName }: { workspaceName: string; workspaceIcon: string }) {
    await this.fetcher.fetchAndCreatePages({
      workspaceName,
      workspaceIcon
    });
  }
}
