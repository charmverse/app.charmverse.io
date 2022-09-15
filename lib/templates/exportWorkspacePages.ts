import { Block } from '@prisma/client';
import { prisma } from 'db';
import type { PageNodeWithChildren } from 'lib/pages';
import { resolvePageTree } from 'lib/pages/server/resolvePageTree';
import { DataNotFoundError } from 'lib/utilities/errors';
import path from 'node:path';
import { validate } from 'uuid';

import fs from 'node:fs/promises';
import { ExportedPage, WorkspaceExport } from './interfaces';

export interface ExportWorkspacePage {
  sourceSpaceIdOrDomain: string;
  exportName?: string
}

/**
 * @abstract Does not currently support bounty or proposal pages
 */
export async function exportWorkspacePages ({ sourceSpaceIdOrDomain, exportName }: ExportWorkspacePage):
Promise<{data: WorkspaceExport, path: string}> {

  const isUuid = validate(sourceSpaceIdOrDomain);

  const space = await prisma.space.findUnique({
    where: isUuid ? { id: sourceSpaceIdOrDomain } : { domain: sourceSpaceIdOrDomain }
  });

  if (!space) {
    throw new DataNotFoundError(`Space not found: ${sourceSpaceIdOrDomain}`);
  }

  const rootPages = await prisma.page.findMany({
    where: {
      spaceId: space.id,
      parentId: null
    }
  });

  // Replace by multi resolve page tree in future
  const mappedTrees = await Promise.all(rootPages.map(async page => {
    return resolvePageTree({ pageId: page.id, flattenChildren: false, fullPage: true });
  }));

  /**
   * Mutates the given node to provision its block data
   */
  async function recursiveResolveBlocks ({ node }: {node: PageNodeWithChildren<ExportedPage>}): Promise<void> {

    if (node.type === 'board' || node.type === 'inline_board' || node.type === 'inline_linked_board') {
      const boardblocks = await prisma.block.findMany({
        where: {
          rootId: node.id as string,
          type: {
            in: ['board', 'view']
          }
        }
      });

      node.blocks = {
        board: boardblocks.find(block => block.type === 'board') as Block,
        views: boardblocks.filter(block => block.type === 'view') as Block[]
      };
    }
    else if (node.type === 'card') {
      const cardBlock = await prisma.block.findFirst({
        where: {
          id: node.id as string,
          type: 'card'
        }
      });

      node.blocks = {
        card: cardBlock as Block
      };
    }

    await Promise.all((node.children ?? []).map(async child => {
      await recursiveResolveBlocks({ node: child });
    }));
  }

  await Promise.all(mappedTrees.map(async tree => {
    await recursiveResolveBlocks({ node: tree.targetPage });
  }));

  const exportFolder = path.join(__dirname, 'exports');

  try {
    await fs.readdir(exportFolder);
  }
  catch (err) {
    await fs.mkdir(exportFolder);
  }

  const exportFilePath = path.join(exportFolder, `${exportName ?? `space-${space.domain}-${Date.now()}`}.json`);

  const exportData: WorkspaceExport = {
    pages: mappedTrees.map(t => t.targetPage)
  };

  await fs.writeFile(exportFilePath, JSON.stringify(exportData, null, 2));

  return {
    data: exportData,
    path: exportFilePath
  };

}
