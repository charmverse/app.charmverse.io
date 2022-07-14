import { PageWithChildren } from 'lib/pages';
import { exportSpacePages } from 'lib/spaces/exportData/exportPages';
import fs from 'node:fs/promises';

async function recursiveWrite ({ entryPoint, page }: {entryPoint: string, page: Omit<PageWithChildren, 'permissions'>}): Promise<true> {
  const folderPath = `${entryPoint}/${page.title}`;

  const folder = await fs.mkdir(folderPath);

  const filePath = `${folderPath}/${page.title}.json`;

  const file = await fs.writeFile(filePath, JSON.stringify({ ...page, children: undefined }, null, 2));

  if (page.children) {
    const childEntryPoint = `${folderPath}/children`;
    await Promise.all(page.children.map(child => {
      return recursiveWrite({
        entryPoint: childEntryPoint,
        page: child
      });
    }));
  }

  return true;

}

async function exportSpacePagesData (spaceId: string): Promise<true> {
  const pages = await exportSpacePages({ spaceId });

  const basePath = `${__dirname}/exports/space-${spaceId}-pages`;

  await pages.map(p => {
    return recursiveWrite({ entryPoint: basePath, page: p });
  });

  return true;
}
