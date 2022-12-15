import type { Client } from '@notionhq/client';
import type { ListBlockChildrenParameters } from '@notionhq/client/build/src/api-endpoints';
import promiseRetry from 'promise-retry';

import type { ChildBlockListResponse, GetDatabaseResponse, GetPageResponse } from '../types';

import type { NotionCache } from './NotionCache';

export class NotionPageFetcher {
  blocksPerRequest: number;

  totalImportedPagesLimit: number;

  cache: NotionCache;

  client: Client;

  constructor({
    client,
    blocksPerRequest = 100,
    totalImportedPagesLimit = 10000,
    cache
  }: {
    client: Client;
    cache: NotionCache;
    blocksPerRequest?: number;
    totalImportedPagesLimit?: number;
  }) {
    this.cache = cache;
    this.client = client;
    this.blocksPerRequest = blocksPerRequest;
    this.totalImportedPagesLimit = totalImportedPagesLimit;
  }

  async fetch() {
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

  async getChildren(listBlockChildrenParameter: ListBlockChildrenParameters) {
    const { client } = this;

    return promiseRetry<ChildBlockListResponse | void>(
      (retry) => {
        return client.blocks.children
          .list(listBlockChildrenParameter)
          .then(
            (response) =>
              ({
                results: response.results,
                request: listBlockChildrenParameter,
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
