import { log } from '@charmverse/core/log';
import type { Page } from '@charmverse/core/prisma';
import type { Client } from '@notionhq/client';
import type {
  DatabaseObjectResponse,
  ListBlockChildrenParameters,
  PageObjectResponse
} from '@notionhq/client/build/src/api-endpoints';
import type { IPropertyTemplate } from '@packages/databases/board';
import { isTruthy } from '@packages/utils/types';
import promiseRetry from 'promise-retry';
import { v4 } from 'uuid';

import { relay } from 'lib/websockets/relay';

import { convertPropertyType } from '../convertPropertyType';
import type { BlocksRecord, ChildBlockListResponse } from '../interfaces';

import { CharmverseDatabasePage } from './CharmverseDatabasePage';
import { CharmversePage } from './CharmversePage';
import type { DatabasePageItem, NotionCache, RegularPageItem } from './NotionCache';

export class NotionPage {
  blocksPerRequest: number;

  totalImportedPagesLimit: number;

  maxChildBlockDepth: number;

  cache: NotionCache;

  client: Client;

  userId: string;

  spaceId: string;

  workspacePageId: string;

  constructor({
    client,
    workspacePageId,
    blocksPerRequest = 100,
    totalImportedPagesLimit = 10000,
    maxChildBlockDepth = 10,
    cache,
    spaceId,
    userId
  }: {
    workspacePageId: string;
    userId: string;
    spaceId: string;
    client: Client;
    cache: NotionCache;
    maxChildBlockDepth?: number;
    blocksPerRequest?: number;
    totalImportedPagesLimit?: number;
  }) {
    this.workspacePageId = workspacePageId;
    this.userId = userId;
    this.spaceId = spaceId;
    this.cache = cache;
    this.client = client;
    this.blocksPerRequest = blocksPerRequest;
    this.maxChildBlockDepth = maxChildBlockDepth;
    this.totalImportedPagesLimit = totalImportedPagesLimit;
  }

  async fetchAndCreatePage({ notionPageId }: { notionPageId: string }): Promise<Page | null> {
    const { cache } = this;
    let notionPage = cache.notionPagesRecord[notionPageId];
    try {
      if (!notionPage) {
        notionPage = await this.retrievePage(notionPageId);
      }
      if (notionPage.object === 'page') {
        const pageRecord = this.cache.pagesRecord.get(notionPageId) as RegularPageItem;
        const { blocksRecord, topLevelBlockIds } =
          pageRecord?.notionPage ?? (await this.fetchNotionPageChildBlocks(notionPageId));
        if (!pageRecord?.notionPage) {
          Object.keys(blocksRecord).forEach((blockId) => {
            cache.blockPageIdRecord.set(blockId, notionPageId);
          });
        }
        if (pageRecord?.charmversePage) {
          return pageRecord.charmversePage;
        }
        const charmversePage = new CharmversePage({
          blocksRecord,
          topLevelBlockIds,
          notionPageId,
          cache: this.cache,
          notionPage: this
        });
        const page = await charmversePage.create();
        relay.broadcast(
          {
            type: 'pages_created',
            payload: [page]
          },
          this.spaceId
        );
        return page;
      } else {
        const pageRecord = this.cache.pagesRecord.get(notionPageId) as DatabasePageItem;

        const { pageIds } = pageRecord?.notionPage ?? (await this.fetchNotionDatabaseChildPages({ notionPageId }));
        if (pageRecord?.charmversePage) {
          return pageRecord.charmversePage;
        }

        const charmverseDatabasePage = new CharmverseDatabasePage({
          pageIds,
          notionPageId,
          cache: this.cache,
          notionPage: this
        });
        const databasePage = await charmverseDatabasePage.create();

        relay.broadcast(
          {
            type: 'pages_created',
            payload: [databasePage]
          },
          this.spaceId
        );

        return databasePage;
      }
    } catch (err: any) {
      if (err.code === 'object_not_found') {
        this.cache.pagesWithoutIntegrationAccess.add(notionPageId);
      }
      if (notionPage) {
        log.warn(`[notion] Failed to fetch and create notion page ${notionPage.id}`, {
          error: err,
          userId: this.userId
        });
      }
      return null;
    }
  }

  private async fetchNotionPageChildBlocks(notionPageId: string): Promise<Required<RegularPageItem>['notionPage']> {
    const pageRecord = this.cache.pagesRecord.get(notionPageId);
    // If notion page hasn't been processed
    if (!pageRecord?.notionPage) {
      const blocksRecord: BlocksRecord = {};
      const { blockChildrenRecord, blocksRecord: nestedBlocksRecord } = await this.fetchNestedChildBlocks([
        notionPageId
      ]);

      const topLevelBlockIds: string[] = Object.keys(nestedBlocksRecord);
      blockChildrenRecord[notionPageId].forEach((childId) => {
        blocksRecord[childId] = nestedBlocksRecord[childId];
      });

      // Only fetch new blocks of parents that has children
      let previousBlockIds = topLevelBlockIds.filter(
        (blockId) =>
          nestedBlocksRecord[blockId].type !== 'child_database' &&
          nestedBlocksRecord[blockId].type !== 'child_page' &&
          nestedBlocksRecord[blockId].has_children
      );

      // Go at most maxChildBlockDepth depth
      for (let depth = 0; depth < this.maxChildBlockDepth; depth++) {
        const { blockChildrenRecord: internalBlockChildrenRecord, blocksRecord: internalBlocksRecord } =
          await this.fetchNestedChildBlocks(previousBlockIds);

        // Store the children ids
        previousBlockIds.forEach((parentBlockId) => {
          blocksRecord[parentBlockId] = {
            ...blocksRecord[parentBlockId],
            children: internalBlockChildrenRecord[parentBlockId]
          };
        });

        Object.values(internalBlocksRecord).forEach((childBlock) => {
          blocksRecord[childBlock.id] = childBlock;
        });

        // Only keep track of the blocks that has children
        previousBlockIds = Object.keys(internalBlocksRecord).filter(
          (blockId) => internalBlocksRecord[blockId].has_children
        );

        if (!previousBlockIds.length) {
          break;
        }
      }

      this.cache.pagesRecord.set(notionPageId, {
        ...pageRecord,
        notionPage: {
          topLevelBlockIds,
          blocksRecord
        },
        type: 'page'
      });

      return {
        topLevelBlockIds,
        blocksRecord
      };
    }
    return pageRecord.notionPage as Required<RegularPageItem>['notionPage'];
  }

  private async fetchNotionDatabaseChildPages({
    notionPageId
  }: {
    notionPageId: string;
  }): Promise<Required<DatabasePageItem>['notionPage']> {
    const pageRecord = this.cache.pagesRecord.get(notionPageId);
    const notionPage = this.cache.notionPagesRecord[notionPageId] as DatabaseObjectResponse;
    if (!pageRecord?.notionPage) {
      const pageIds: string[] = [];
      await this.cache.rateLimiter();
      let databaseQueryResponse = await this.client.databases.query({ database_id: notionPageId });
      databaseQueryResponse.results.forEach((page) => {
        this.cache.notionPagesRecord[page.id] = page as PageObjectResponse | DatabaseObjectResponse;
        pageIds.push(page.id);
      });

      while (databaseQueryResponse.has_more) {
        await this.cache.rateLimiter();
        databaseQueryResponse = await this.client.databases.query({
          database_id: notionPageId,
          start_cursor: databaseQueryResponse.next_cursor ?? undefined
        });
        databaseQueryResponse.results.forEach((page) => {
          this.cache.notionPagesRecord[page.id] = page as PageObjectResponse | DatabaseObjectResponse;
          pageIds.push(page.id);
        });
      }

      const databaseProperties = Object.values(notionPage.properties);
      const boardPropertiesRecord: Record<string, IPropertyTemplate> = {};

      databaseProperties.forEach((property) => {
        const propertyType = convertPropertyType(property.type);
        if (propertyType) {
          const cardProperty: IPropertyTemplate = {
            id: v4(),
            name: property.name,
            options: [],
            type: propertyType
          };

          boardPropertiesRecord[property.id] = cardProperty;
          if (property.type === 'select' || property.type === 'multi_select') {
            (property as any)[property.type].options.forEach((option: { id: string; name: string; color: string }) => {
              cardProperty.options.push({
                value: option.name,
                color: `propColor${option.color.charAt(0).toUpperCase() + option.color.slice(1)}`,
                id: option.id
              });
            });
          }
        }
      });

      this.cache.pagesRecord.set(notionPageId, {
        ...pageRecord,
        notionPage: {
          pageIds,
          properties: boardPropertiesRecord
        },
        type: 'database'
      });

      return {
        properties: boardPropertiesRecord,
        pageIds
      };
    }

    return pageRecord.notionPage as Required<DatabasePageItem>['notionPage'];
  }

  private async fetchNestedChildBlocks(parentBlockIds: string[]) {
    const { fetchChildBlocks, blocksPerRequest, client, cache } = this;
    // Record to keep track of blockid and its latest cursor
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
              client,
              cache
            ).catch((err) => {
              log.warn('[notion] Error retrieving child blocks', {
                error: err,
                blockId: parentBlockId,
                spaceId: this.spaceId,
                userId: this.userId
              });
            })
          )
        )
      ).filter(isTruthy);

      let fetchMore = false;

      if (childBlockListResponses.length) {
        childBlockListResponses.forEach((childBlockListResponse) => {
          if (!blockChildrenRecord[childBlockListResponse.parent_block_id]) {
            blockChildrenRecord[childBlockListResponse.parent_block_id] = [];
          }

          childBlockListResponse.results.forEach((result) => {
            blockChildrenRecord[childBlockListResponse.parent_block_id].push(result.id);
          });

          childBlockListResponse.results.forEach((result) => {
            blocksRecord[result.id] = {
              ...result,
              children: [],
              has_children: result.has_children
            };
          });

          // Only if there is a next_cursor continue further
          if (childBlockListResponse.next_cursor) {
            blockCursorRecord[childBlockListResponse.parent_block_id] = childBlockListResponse.next_cursor;
            fetchMore = fetchMore || true;
          }
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

  private async retrievePage(notionPageId: string) {
    // If the page doesn't exist in the cache fetch it
    if (!this.cache.notionPagesRecord[notionPageId]) {
      await this.cache.rateLimiter();
      const pageResponse = (await this.client.pages.retrieve({
        page_id: notionPageId
      })) as unknown as PageObjectResponse;
      this.cache.notionPagesRecord[notionPageId] = pageResponse;
      log.debug(`[notion] Retrieved page ${notionPageId} manually`, { userId: this.userId });
    }

    return this.cache.notionPagesRecord[notionPageId];
  }

  // For some reason this this.client doesn't work so passing it as parameter
  private async fetchChildBlocks(
    listBlockChildrenParameters: ListBlockChildrenParameters,
    client: Client,
    cache: NotionCache
  ) {
    return promiseRetry<ChildBlockListResponse | void>(
      async (retry) => {
        await cache.rateLimiter();
        return client.blocks.children
          .list(listBlockChildrenParameters)
          .then(
            (response) =>
              ({
                results: response.results,
                parent_block_id: listBlockChildrenParameters.block_id,
                next_cursor: response.next_cursor
              }) as ChildBlockListResponse
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
