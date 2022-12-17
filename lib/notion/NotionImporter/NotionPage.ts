import type { Client } from '@notionhq/client';
import type {
  DatabaseObjectResponse,
  ListBlockChildrenParameters,
  PageObjectResponse
} from '@notionhq/client/build/src/api-endpoints';
import type { Page } from '@prisma/client';
import promiseRetry from 'promise-retry';
import { v4 } from 'uuid';

import type { IPropertyTemplate } from 'lib/focalboard/board';
import { isTruthy } from 'lib/utilities/types';

import { convertPropertyType } from '../convertPropertyType';
import type { BlocksRecord, ChildBlockListResponse } from '../types';

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

  async fetchAndCreatePage({ notionPageId }: { notionPageId: string }): Promise<Page> {
    let notionPage = this.cache.notionPagesRecord[notionPageId];
    if (!notionPage) {
      notionPage = await this.retrievePage(notionPageId);
    }

    if (notionPage.object === 'page') {
      const { blocksRecord, topLevelBlockIds } = await this.fetchNotionPageChildBlocks(notionPageId);

      const charmversePage = new CharmversePage({
        blocksRecord,
        topLevelBlockIds,
        notionPageId,
        cache: this.cache,
        notionPage: this
      });

      return charmversePage.create();
    } else {
      const { pageIds } = await this.fetchNotionDatabaseChildPages({ notionPageId });

      const charmverseDatabasePage = new CharmverseDatabasePage({
        pageIds,
        notionPageId,
        cache: this.cache,
        notionPage: this
      });

      return charmverseDatabasePage.create();
    }
  }

  private async fetchNotionPageChildBlocks(notionPageId: string): Promise<Required<RegularPageItem>['notionPage']> {
    const pageRecord = this.cache.pagesRecord.get(notionPageId);
    if (!pageRecord?.notionPage) {
      const blocksRecord: BlocksRecord = {};
      const { blockChildrenRecord, blocksRecord: nestedBlocksRecord } = await this.fetchNestedChildBlocks([
        notionPageId
      ]);

      const topLevelBlockIds: string[] = Object.keys(nestedBlocksRecord);
      blockChildrenRecord[notionPageId].forEach((childId) => {
        blocksRecord[childId] = nestedBlocksRecord[childId];
      });

      let previousBlocks = [...topLevelBlockIds];

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
      let databaseQueryResponse = await this.client.databases.query({ database_id: notionPageId });
      databaseQueryResponse.results.forEach((page) => {
        this.cache.notionPagesRecord[page.id] = page as PageObjectResponse | DatabaseObjectResponse;
        pageIds.push(page.id);
      });

      while (databaseQueryResponse.has_more) {
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
      })) as unknown as PageObjectResponse;
      this.cache.notionPagesRecord[notionPageId] = pageResponse;
      log.debug(`[notion]: Retrieved page ${notionPageId} manually`);
    }

    return this.cache.notionPagesRecord[notionPageId];
  }

  async retrieveDatabasePage(notionDatabasePageId: string) {
    if (!this.cache.notionPagesRecord[notionDatabasePageId]) {
      const databasePage = (await this.client.databases.retrieve({
        database_id: notionDatabasePageId
      })) as DatabaseObjectResponse;
      this.cache.notionPagesRecord[notionDatabasePageId] = databasePage;
      log.debug(`[notion]: Retrieved database ${notionDatabasePageId} manually`);
    }

    return this.cache.notionPagesRecord[notionDatabasePageId];
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
