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

  // return Object.values().slice(0, 25);
  return [];
}
