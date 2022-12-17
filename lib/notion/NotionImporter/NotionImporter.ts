import { Client } from '@notionhq/client';
import { v4 } from 'uuid';

import { createPrismaPage } from '../createPrismaPage';
import type { GetPageResponse, GetDatabaseResponse } from '../types';

import { NotionCache } from './NotionCache';
import { NotionPage } from './NotionPage';

export class NotionImporter {
  cache: NotionCache;

  client: Client;

  userId: string;

  spaceId: string;

  notionPage: NotionPage;

  workspacePageId: string;

  blocksPerRequest: number;

  totalImportedPagesLimit: number;

  maxChildBlockDepth: number;

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
    const workspacePageId = v4();
    const notionCache = new NotionCache();
    const notionPage = new NotionPage({
      blocksPerRequest,
      maxChildBlockDepth,
      totalImportedPagesLimit,
      client,
      cache: notionCache,
      spaceId,
      userId,
      workspacePageId
    });

    this.workspacePageId = workspacePageId;
    this.cache = notionCache;
    this.notionPage = notionPage;
    this.client = client;
    this.userId = userId;
    this.spaceId = spaceId;
    this.blocksPerRequest = blocksPerRequest;
    this.maxChildBlockDepth = maxChildBlockDepth;
    this.totalImportedPagesLimit = totalImportedPagesLimit;
  }

  /**
   * Fetch accessible notion pages
   */
  async import({ workspaceIcon, workspaceName }: { workspaceName: string; workspaceIcon: string }) {
    const { notionPagesRecord } = this.cache;
    let searchResult = await this.client.search({
      page_size: this.blocksPerRequest
    });

    const notionPages: (GetPageResponse | GetDatabaseResponse)[] = [];
    notionPages.push(...(searchResult.results as (GetPageResponse | GetDatabaseResponse)[]));

    // Store all the pages/databases the integration fetched in a record
    // While there are more pages the integration has access to
    while (searchResult.has_more && searchResult.next_cursor && notionPages.length < this.totalImportedPagesLimit) {
      searchResult = await this.client.search({
        page_size: this.blocksPerRequest,
        start_cursor: searchResult.next_cursor
      });
      notionPages.push(...(searchResult.results as (GetPageResponse | GetDatabaseResponse)[]));
    }

    notionPages.forEach((notionPage) => {
      notionPagesRecord[notionPage.id] = notionPage;
    });

    await createPrismaPage({
      createdBy: this.userId,
      spaceId: this.spaceId,
      id: this.workspacePageId,
      title: workspaceName,
      icon: workspaceIcon
    });

    for (const notionPage of notionPages) {
      // Only create the root-level pages first
      if (notionPage.parent.type === 'workspace') {
        await this.notionPage.fetchAndCreatePage({
          notionPageId: notionPage.id
        });
      }
    }
  }
}
