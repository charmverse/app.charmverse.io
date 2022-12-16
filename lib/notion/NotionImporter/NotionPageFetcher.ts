import type { Client } from '@notionhq/client';
import type { ListBlockChildrenParameters } from '@notionhq/client/build/src/api-endpoints';
import promiseRetry from 'promise-retry';
import { v4 } from 'uuid';

import { isTruthy } from 'lib/utilities/types';

import { convertToPlainText } from '../convertToPlainText';
import { createPrismaPage } from '../createPrismaPage';
import type { BlocksRecord, ChildBlockListResponse, GetDatabaseResponse, GetPageResponse } from '../types';

import type { NotionCache } from './NotionCache';
import { PageCreator } from './PageCreator';

export class NotionPageFetcher {
  blocksPerRequest: number;

  totalImportedPagesLimit: number;

  maxChildBlockDepth: number;

  cache: NotionCache;

  client: Client;

  constructor({
    client,
    blocksPerRequest = 100,
    totalImportedPagesLimit = 10000,
    maxChildBlockDepth = 10,
    cache
  }: {
    client: Client;
    cache: NotionCache;
    maxChildBlockDepth?: number;
    blocksPerRequest?: number;
    totalImportedPagesLimit?: number;
  }) {
    this.cache = cache;
    this.client = client;
    this.blocksPerRequest = blocksPerRequest;
    this.maxChildBlockDepth = maxChildBlockDepth;
    this.totalImportedPagesLimit = totalImportedPagesLimit;
  }

  /**
   * Fetch accessible notion pages
   */
  async fetchAndCreatePages({
    spaceId,
    userId,
    workspaceIcon,
    workspaceName
  }: {
    spaceId: string;
    userId: string;
    workspaceName: string;
    workspaceIcon: string;
  }) {
    const { notionPagesRecord, notionPages = [] } = this.cache;
    let searchResult = await this.client.search({
      page_size: this.blocksPerRequest
    });

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
      // This would ideally decrease the amount of api requests made to fetch a page/database
      notionPagesRecord[notionPage.id] = notionPage;
    });

    const workspacePageId = v4();
    const workspacePage = await createPrismaPage({
      createdBy: userId,
      spaceId,
      id: workspacePageId,
      title: workspaceName,
      icon: workspaceIcon
    });

    for (const notionPage of notionPages) {
      const createdPage = await this.fetchAndCreatePage({
        notionPageId: notionPage.id,
        spaceId,
        userId,
        parentId: workspacePage.id
      });
      this.cache.createdCharmversePageIds.add(createdPage.id);
    }
  }

  async fetchAndCreatePage({
    notionPageId,
    spaceId,
    userId,
    parentId
  }: {
    notionPageId: string;
    spaceId: string;
    userId: string;
    parentId: string;
  }) {
    const notionPage = this.cache.notionPagesRecord[notionPageId];
    const [firstLevelBlocks, blocksRecord] = await this.fetchNotionPageChildBlocks(notionPageId);
    const pageCreator = new PageCreator({
      blocksRecord,
      firstLevelBlocks,
      notionPageId
    });

    const pageTitleRichText = Object.values(notionPage.properties).find((property) => property.type === 'title')?.title;
    return pageCreator.create({
      spaceId,
      userId,
      parentId,
      title: pageTitleRichText ? convertToPlainText(pageTitleRichText) : 'Untitled',
      icon: notionPage.icon?.type === 'emoji' ? notionPage.icon.emoji : ''
    });
  }

  async fetchNotionPageChildBlocks(pageId: string) {
    const blocksRecord: BlocksRecord = {};

    const { blockChildrenRecord, blocksRecord: nestedBlocksRecord } = await this.fetchNestedChildBlocks([pageId]);

    const firstLevelBlocks: string[] = Object.keys(nestedBlocksRecord);
    blockChildrenRecord[pageId].forEach((childId) => {
      blocksRecord[childId] = nestedBlocksRecord[childId];
    });

    let previousBlocks = [...firstLevelBlocks];

    for (let depth = 0; depth < this.maxChildBlockDepth; depth++) {
      const { blockChildrenRecord: internalBlockChildrenRecord, blocksRecord: internalBlocksRecord } =
        await this.fetchNestedChildBlocks(previousBlocks);

      // Store the children id in blocks record
      previousBlocks.forEach((parentBlockId) => {
        blocksRecord[parentBlockId] = {
          ...blocksRecord[parentBlockId],
          children: internalBlockChildrenRecord[parentBlockId]
        };
      });

      previousBlocks = Object.keys(internalBlocksRecord);

      previousBlocks.forEach((previousBlockId) => {
        blocksRecord[previousBlockId] = internalBlocksRecord[previousBlockId];
      });

      if (!previousBlocks.length) {
        break;
      }
    }

    return [firstLevelBlocks, blocksRecord] as const;
  }

  async fetchNestedChildBlocks(parentBlockIds: string[]) {
    const { fetchChildBlocks, blocksPerRequest, client } = this;
    const blockCursorRecord: Record<string, string> = {};
    let childBlockListResponses: ChildBlockListResponse[] = [];
    // A record to keep track of parent and children ids
    const blockChildrenRecord: Record<string, string[]> = {};
    const blocksRecord: BlocksRecord = {};

    // eslint-disable-next-line no-constant-condition
    while (true) {
      childBlockListResponses = (
        await Promise.all(
          parentBlockIds.map((parentBlockId) =>
            fetchChildBlocks(
              {
                block_id: parentBlockId,
                page_size: blocksPerRequest,
                start_cursor: blockCursorRecord[parentBlockId]
              },
              client
            )
          )
        )
      ).filter(isTruthy);

      let fetchMore = false;

      if (childBlockListResponses.length) {
        childBlockListResponses.forEach((childBlockListResponse) => {
          if (!blockChildrenRecord[childBlockListResponse.block_id]) {
            blockChildrenRecord[childBlockListResponse.block_id] = [];
          }

          childBlockListResponse.results.forEach((result) => {
            blockChildrenRecord[childBlockListResponse.block_id].push(result.id);
          });

          childBlockListResponse.results.forEach((result) => {
            blocksRecord[result.id] = {
              ...result,
              children: []
            };
          });

          if (!blockCursorRecord[childBlockListResponse.block_id] && childBlockListResponse.next_cursor) {
            blockCursorRecord[childBlockListResponse.block_id] = childBlockListResponse.next_cursor;
            fetchMore = fetchMore || true;
          }
          return childBlockListResponse.results;
        });
      } else {
        break;
      }

      if (!fetchMore) {
        break;
      }
    }

    return {
      blockChildrenRecord,
      blocksRecord
    };
  }

  async retrievePage(notionPageId: string) {
    // If the page doesn't exist in the cache fetch it
    if (!this.cache.notionPagesRecord[notionPageId]) {
      const pageResponse = (await this.client.pages.retrieve({
        page_id: notionPageId
      })) as unknown as GetPageResponse;
      this.cache.notionPagesRecord[notionPageId] = pageResponse;
      this.cache.notionPages.push(pageResponse);
      log.debug(`[notion]: Retrieved page ${notionPageId} manually`);
    }
  }

  async retrieveDatabasePage(notionDatabasePageId: string) {
    if (!this.cache.notionPagesRecord[notionDatabasePageId]) {
      const databasePage = (await this.client.databases.retrieve({
        database_id: notionDatabasePageId
      })) as GetDatabaseResponse;
      this.cache.notionPagesRecord[notionDatabasePageId] = databasePage;
      this.cache.notionPages.push(databasePage);
      log.debug(`[notion]: Retrieved database ${notionDatabasePageId} manually`);
    }
  }

  async fetchChildBlocks(listBlockChildrenParameters: ListBlockChildrenParameters, client: Client) {
    return promiseRetry<ChildBlockListResponse | void>(
      (retry) => {
        return client.blocks.children
          .list(listBlockChildrenParameters)
          .then(
            (response) =>
              ({
                results: response.results,
                block_id: listBlockChildrenParameters.block_id,
                next_cursor: response.next_cursor
              } as ChildBlockListResponse)
          )
          .catch((error) => {
            if (error.status > 499) {
              retry(error);
            } else {
              throw error;
            }
          });
      },
      {
        retries: 3
      }
    );
  }
}
