import { log } from '@charmverse/core/log';

import { relay } from 'lib/websockets/relay';

import { NotionImporter } from './NotionImporter/NotionImporter';

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
  const notionImporter = new NotionImporter({
    accessToken,
    spaceId,
    userId
  });

  await notionImporter.import({
    workspaceName,
    workspaceIcon
  });

  const pagesRecordValues = Array.from(notionImporter.cache.pagesRecord.values());
  const totalNotionPages = pagesRecordValues.filter((value) => value.notionPage).length;
  const totalImportedPages = pagesRecordValues.filter((value) => value.charmversePage).length;
  const failedImports = Object.values(notionImporter.cache.failedImportsRecord).slice(0, 25);

  relay.broadcast(
    {
      type: 'notion_import_completed',
      payload: {
        totalImportedPages,
        totalPages: totalNotionPages,
        failedImports
      }
    },
    spaceId
  );

  log.info('[notion] Completed import of Notion pages', {
    'Notion pages': totalNotionPages,
    'Created CharmVerse pages (incl. cards)': totalImportedPages,
    'Failed import pages': failedImports,
    'Pages without integration access': notionImporter.cache.pagesWithoutIntegrationAccess
  });

  return [];
}
