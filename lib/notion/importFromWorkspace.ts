import { Client } from '@notionhq/client';

import log from 'lib/log';

import { CharmversePageCreator } from './NotionImporter/CharmversePage';
import { InMemoryRepresentation } from './NotionImporter/InMemoryRepresentation';
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

  // 1. Fetch all notion pages and store them in memory
  const notionPageFetcher = new NotionPageFetcher({ client, cache: notionCache });
  await notionPageFetcher.fetch();

  // 2. Store in memory representations of pages and databases to be created
  const inMemoryRepresentation = new InMemoryRepresentation({ client, cache: notionCache, fetcher: notionPageFetcher });
  await inMemoryRepresentation.represent({
    spaceId,
    userId
  });

  // 3. Create charmverse pages from in notion pages
  const charmversePageCreator = new CharmversePageCreator({ cache: notionCache, fetcher: notionPageFetcher });
  await charmversePageCreator.create({
    spaceId,
    userId,
    workspaceIcon,
    workspaceName
  });

  const {
    notionPages,
    charmversePagesRecord,
    charmverseCardsRecord,
    failedImportsRecord,
    pagesWithoutIntegrationAccess
  } = notionCache;
  log.debug(`[notion] Fetching content for ${notionCache.notionPages.length} pages`, { spaceId });

  log.info('[notion] Completed import of Notion pages', {
    'Notion pages': notionPages.length,
    'CharmVerse pages': Object.keys(charmversePagesRecord).length,
    'CharmVerse cards': Object.keys(charmverseCardsRecord).length,
    'Created CharmVerse pages (incl. cards)': charmversePageCreator.createdCharmversePageIds.size,
    'Failed import pages': failedImportsRecord,
    pagesWithoutIntegrationAccess
  });

  return Object.values(failedImportsRecord).slice(0, 25);
}
