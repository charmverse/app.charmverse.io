import log from 'lib/log';

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

  log.info('[notion] Completed import of Notion pages', {
    'Notion pages': pagesRecordValues.filter((value) => value.notionPage).length,
    'Created CharmVerse pages (incl. cards)': pagesRecordValues.filter((value) => value.charmversePage).length,
    'Failed import pages': Object.values(notionImporter.cache.failedImportsRecord).slice(0, 25),
    'Pages without integration access': notionImporter.cache.pagesWithoutIntegrationAccess
  });

  return [];
}
