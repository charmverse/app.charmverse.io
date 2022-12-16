import { Client } from '@notionhq/client';

import log from 'lib/log';

import { NotionCache } from './NotionImporter/NotionCache';
import { NotionPageFetcher } from './NotionImporter/NotionPageFetcher';

export async function importFromWorkspace({
  workspaceName,
  workspaceIcon,
  accessToken,
  userId,
  spaceId
}: {
  accessToken: string;
  spaceId: string;
  userId: string;
  workspaceName: string;
  workspaceIcon: string;
}) {
  const client = new Client({
    auth: accessToken
  });

  const notionCache = new NotionCache({ spaceId, userId });
  const notionPageFetcher = new NotionPageFetcher({ client, cache: notionCache });
  await notionPageFetcher.fetchAndCreatePages({
    spaceId,
    userId,
    workspaceName,
    workspaceIcon
  });

  // const {
  //   notionPages,
  //   charmversePagesRecord,
  //   charmverseCardsRecord,
  //   failedImportsRecord,
  //   pagesWithoutIntegrationAccess
  //   // createdCharmversePageIds
  // } = notionCache;
  // log.debug(`[notion] Fetching content for ${notionCache.notionPages.length} pages`, { spaceId });

  // log.info('[notion] Completed import of Notion pages', {
  //   'Notion pages': notionPages.length,
  //   'CharmVerse pages': Object.keys(charmversePagesRecord).length,
  //   'CharmVerse cards': Object.keys(charmverseCardsRecord).length,
  //   // 'Created CharmVerse pages (incl. cards)': createdCharmversePageIds.size,
  //   'Failed import pages': failedImportsRecord,
  //   pagesWithoutIntegrationAccess
  // });

  // return Object.values(failedImportsRecord).slice(0, 25);
}
