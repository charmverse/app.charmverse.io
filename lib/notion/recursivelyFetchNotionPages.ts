import { Client } from '@notionhq/client';

import type { GetDatabaseResponse, GetPageResponse } from './types';

export async function fetchNotionPages({
  accessToken,
  blocksPerRequest = 100,
  totalImportedPagesLimit = 10000
}: {
  accessToken: string;
  blocksPerRequest?: number;
  totalImportedPagesLimit?: number;
}) {
  const notionPagesRecord: Record<string, GetPageResponse | GetDatabaseResponse> = {};

  const notion = new Client({
    auth: accessToken
  });

  let searchResult = await notion.search({
    page_size: blocksPerRequest
  });

  // Store all the blocks the integration has access to
  const notionPages = searchResult.results as (GetPageResponse | GetDatabaseResponse)[];
  // Store all the pages/databases the integration fetched in a record
  // While there are more pages the integration has access to
  while (searchResult.has_more && searchResult.next_cursor && notionPages.length < totalImportedPagesLimit) {
    searchResult = await notion.search({
      page_size: blocksPerRequest,
      start_cursor: searchResult.next_cursor
    });
    notionPages.push(...(searchResult.results as (GetPageResponse | GetDatabaseResponse)[]));
  }

  notionPages.forEach((notionPage) => {
    // This would ideally decrease the amount of api requests made to fetch a page/database
    notionPagesRecord[notionPage.id] = notionPage;
  });

  return {
    notionPages,
    notionPagesRecord
  };
}
