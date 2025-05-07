import { getLogger } from '@charmverse/core/log';
import { Client } from '@notionhq/client';
import type { DatabaseObjectResponse, PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { relay } from 'lib/websockets/relay';
import { v4 } from 'uuid';

import { createPrismaPage } from '../createPrismaPage';

import { NotionCache } from './NotionCache';
import { NotionPage } from './NotionPage';

const log = getLogger('notion-client');

export class NotionImporter {
  cache: NotionCache;

  client: Client;

  userId: string;

  spaceId: string;

  blocksPerRequest: number;

  totalImportedPagesLimit: number;

  maxChildBlockDepth: number;

  constructor({
    blocksPerRequest = 100,
    totalImportedPagesLimit = 10000,
    maxChildBlockDepth = 10,
    spaceId,
    userId,
    accessToken,
    client
  }: {
    userId: string;
    spaceId: string;
    accessToken?: string;
    maxChildBlockDepth?: number;
    blocksPerRequest?: number;
    totalImportedPagesLimit?: number;
    client?: Client;
  }) {
    this.client =
      client ??
      new Client({
        auth: accessToken,
        logger(logLevel, message, extraInfo) {
          if (log[logLevel]) {
            log[logLevel](message, extraInfo);
          }
        }
      });
    const notionCache = new NotionCache();

    this.cache = notionCache;
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

    const notionPages: (PageObjectResponse | DatabaseObjectResponse)[] = [];
    notionPages.push(...(searchResult.results as (PageObjectResponse | DatabaseObjectResponse)[]));

    // Store all the pages/databases the integration fetched in a record
    // While there are more pages the integration has access to
    while (searchResult.has_more && searchResult.next_cursor && notionPages.length < this.totalImportedPagesLimit) {
      searchResult = await this.client.search({
        page_size: this.blocksPerRequest,
        start_cursor: searchResult.next_cursor
      });
      notionPages.push(...(searchResult.results as (PageObjectResponse | DatabaseObjectResponse)[]));
    }

    notionPages.forEach((notionPage) => {
      notionPagesRecord[notionPage.id] = notionPage;
    });

    log.debug(`[notion] Fetching content for ${notionPages.length} pages`, {
      spaceId: this.spaceId,
      userId: this.userId
    });

    const workspacePageId = v4();

    // Create a root level page for the notion workspace
    const rootPage = await createPrismaPage({
      createdBy: this.userId,
      spaceId: this.spaceId,
      id: workspacePageId,
      title: workspaceName,
      icon: workspaceIcon
    });

    relay.broadcast(
      {
        type: 'pages_created',
        payload: [rootPage]
      },
      this.spaceId
    );

    const notionPage = new NotionPage({
      blocksPerRequest: this.blocksPerRequest,
      maxChildBlockDepth: this.maxChildBlockDepth,
      totalImportedPagesLimit: this.totalImportedPagesLimit,
      client: this.client,
      cache: this.cache,
      spaceId: this.spaceId,
      userId: this.userId,
      workspacePageId
    });

    for (const {
      id: notionPageId,
      parent: { type: parentType }
    } of notionPages) {
      // Only create the root-level pages first
      if (parentType === 'workspace') {
        await notionPage.fetchAndCreatePage({
          notionPageId
        });
      }
    }
  }
}
