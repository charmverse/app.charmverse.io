import { Client } from '@notionhq/client';

import type { DatabaseObjectResponse, PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

const accessToken = 'secret_';
const blocksPerRequest = 100;
const totalImportedPagesLimit = 10000;

async function search() {
  const client = new Client({
    auth: accessToken
    // logger(logLevel, message, extraInfo) {
    //   if (log[logLevel]) {
    //     log[logLevel](message, extraInfo);
    //   }
    // }
  });
  let searchResult = await client.search({
    page_size: blocksPerRequest
  });

  const notionPages: (PageObjectResponse | DatabaseObjectResponse)[] = [];
  notionPages.push(...(searchResult.results as (PageObjectResponse | DatabaseObjectResponse)[]));

  // Store all the pages/databases the integration fetched in a record
  // While there are more pages the integration has access to
  while (searchResult.has_more && searchResult.next_cursor && notionPages.length < totalImportedPagesLimit) {
    searchResult = await client.search({
      page_size: blocksPerRequest,
      start_cursor: searchResult.next_cursor
    });
    notionPages.push(...(searchResult.results as (PageObjectResponse | DatabaseObjectResponse)[]));
    console.log(notionPages.length);
  }

  console.log(notionPages.length);
}

search().then(() => console.log('Done'));
