import fs from 'node:fs/promises';
import path from 'node:path';

import type { Block, PageType } from '@prisma/client';
import { validate } from 'uuid';

import { prisma } from 'db';
import type { PageNodeWithChildren } from 'lib/pages';
import { resolvePageTree } from 'lib/pages/server/resolvePageTree';
import { DataNotFoundError } from 'lib/utilities/errors';

import type { ExportedPage, WorkspaceExport } from './interfaces';

export interface ExportWorkspacePage {
  sourceSpaceIdOrDomain: string;
  exportName?: string;
}

const excludedPageTypes: PageType[] = ['bounty', 'bounty_template', 'proposal', 'proposal_template'];

/**
 * @abstract Does not currently support bounty or proposal pages
 */
export async function exportWorkspacePages ({ sourceSpaceIdOrDomain }: Pick<ExportWorkspacePage, 'sourceSpaceIdOrDomain'>):
  Promise<{ data: WorkspaceExport }>
export async function exportWorkspacePages ({ sourceSpaceIdOrDomain, exportName }: Required<ExportWorkspacePage>
): Promise<{ data: WorkspaceExport, path: string }>
export async function exportWorkspacePages ({ sourceSpaceIdOrDomain, exportName }: ExportWorkspacePage):
  Promise<{ data: WorkspaceExport, path?: string }> {

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
      deletedAt: null,
      parentId: null,
      type: {
        notIn: excludedPageTypes
      }
    }
  });

  // Replace by multi resolve page tree in future
  const mappedTrees = await Promise.all(rootPages.map(async page => {
    return resolvePageTree({ pageId: page.id, flattenChildren: true, fullPage: true });
  }));

  // Console reporting for manual exports
  const pageIndexes = mappedTrees.reduce((acc, val) => {

    let pageCount = Object.keys(acc).length;

    [val.targetPage, ...val.flatChildren].forEach(p => {
      pageCount += 1;
      acc[p.id] = pageCount;
    });

    return acc;
  }, {} as Record<string, number>);

  const totalPages = Object.keys(pageIndexes).length;

  /**
   * Mutates the given node to provision its block data
   */
  async function recursiveResolveBlocks ({ node }:
    { node: PageNodeWithChildren<ExportedPage> }): Promise<void> {

    // eslint-disable-next-line no-console
    // console.log('Processing page ', pageIndexes[node.id], ' / ', totalPages);

    if (node.type.match('board')) {
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
    else if (node.type.match('card')) {
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

    node.children = node.children?.filter(child => !excludedPageTypes.includes(child.type)) ?? [];

    await Promise.all(
      (node.children ?? [])
        .map(async (child) => {
          await recursiveResolveBlocks({ node: child });
        })
    );
  }

  await Promise.all(mappedTrees.map(async (tree) => {
    await recursiveResolveBlocks({ node: tree.targetPage });
  }));

  const exportFolder = path.join(__dirname, 'exports');

  try {
    await fs.readdir(exportFolder);
  }
  catch (err) {
    await fs.mkdir(exportFolder);
  }

  const exportData: WorkspaceExport = {
    pages: mappedTrees.map(t => t.targetPage)
  };

  if (!exportName) {
    return {
      data: exportData
    };
  }

  // Continue writing only if an export name was provided
  const exportFilePath = path.join(exportFolder, `${exportName}.json`);

  await fs.writeFile(exportFilePath, JSON.stringify(exportData, null, 2));

  return {
    data: exportData,
    path: exportFilePath
  };

}
