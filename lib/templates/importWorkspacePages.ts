import fs from 'node:fs/promises';
import path from 'node:path';

import type { Page, Prisma } from '@prisma/client';
import { v4, validate } from 'uuid';

import { prisma } from 'db';
import log from 'lib/log';
import { checkIsContentEmpty } from 'lib/pages/checkIsContentEmpty';
import { createPage } from 'lib/pages/server/createPage';
import { getPagePath } from 'lib/pages/utils';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { typedKeys } from 'lib/utilities/objects';
import type { PageContent } from 'models';

import type { ExportedPage, WorkspaceExport, WorkspaceImport } from './interfaces';

interface UpdateRefs {
  oldNewHashMap: Record<string, string>;
  pages: Page[];
}

/**
 * Mutates the provided content to replace nested page refs
 */
function updateReferences ({ oldNewHashMap, pages }: UpdateRefs) {
  pages.forEach(p => {
    const prosemirrorNodes = (p.content as PageContent)?.content;
    if (prosemirrorNodes) {
      let prosemirrorNodesAsText = JSON.stringify(prosemirrorNodes);

      // Step 1 - Update all nested page links
      const nestedPageRefs = prosemirrorNodesAsText.match(/{"type":"page","attrs":{"id":"((\d|[a-f]){1,}-){1,}(\d|[a-f]){1,}"}}/g);

      nestedPageRefs?.forEach(pageLinkNode => {
        const oldPageId = pageLinkNode.match(/((\d|[a-f]){1,}-){1,}(\d|[a-f]){1,}/)?.[0];
        const newPageId = oldPageId ? oldNewHashMap[oldPageId] : undefined;

        if (oldPageId && newPageId) {
          prosemirrorNodesAsText = prosemirrorNodesAsText.replace(oldPageId, newPageId);
        }
      });

      (p.content as PageContent).content = JSON.parse(prosemirrorNodesAsText);
    }
  });
}

interface WorkspaceImportResult {
  pages: number;
  blocks: number;
}

export async function generateImportWorkspacePages ({ targetSpaceIdOrDomain, exportData, exportName }: WorkspaceImport):
Promise<{ pageArgs: Prisma.PageCreateArgs[], blockArgs: Prisma.BlockCreateManyArgs }> {
  const isUuid = validate(targetSpaceIdOrDomain);

  const space = await prisma.space.findUnique({
    where: isUuid ? { id: targetSpaceIdOrDomain } : { domain: targetSpaceIdOrDomain }
  });

  if (!space) {
    throw new DataNotFoundError(`Space not found: ${targetSpaceIdOrDomain}`);
  }

  const dataToImport: WorkspaceExport = exportData ?? JSON.parse(await fs.readFile(path.join(__dirname, 'exports', `${exportName}.json`), 'utf-8'));

  if (!dataToImport) {
    throw new InvalidInputError('Please provide the source export data, or export path');
  }

  // List of page object references which we will mutate
  const flatPages: Page[] = [];

  const pageArgs: Prisma.PageCreateArgs[] = [];

  const blockArgs: Prisma.BlockCreateManyInput[] = [];

  // 2 way hashmap to find link between new and old page ids
  const oldNewHashmap: Record<string, string> = {
  };

  /**
   * Mutates the pages, updating their ids
   */
  function recursivePagePrep ({ node, newParentId, rootSpacePermissionId }:
    { node: ExportedPage, newParentId: string | null, rootSpacePermissionId?: string }) {
    const newId = v4();

    oldNewHashmap[newId] = node.id;
    oldNewHashmap[node.id] = newId;

    flatPages.push(node);

    const { children, permissions, createdBy, updatedBy, spaceId, cardId, proposalId, parentId, bountyId, blocks, ...pageWithoutJoins } = node;

    typedKeys(pageWithoutJoins).forEach(key => {
      if (pageWithoutJoins[key] == null) {
        delete pageWithoutJoins[key];
      }
    });

    const newPermissionId = v4();

    // Reassigned when creating the root permission
    rootSpacePermissionId = rootSpacePermissionId ?? newPermissionId;

    const newPageContent: Prisma.PageCreateArgs = {
      data: {
        ...pageWithoutJoins,
        id: newId,
        boardId: node.type.match('board') ? newId : undefined,
        parentId: newParentId ?? undefined,
        content: node.content as Prisma.InputJsonValue ?? undefined,
        path: getPagePath(),
        space: {
          connect: {
            // eslint-disable @typescript-eslint/no-non-null-assertion
            id: space!.id
          }
        },
        permissions: {
          createMany: {
            data: [{
              id: newPermissionId,
              permissionLevel: space?.defaultPagePermissionGroup ?? 'full_access',
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              spaceId: space!.id,
              inheritedFromPermission: rootSpacePermissionId === newPermissionId ? undefined : rootSpacePermissionId
            }]
          }
        },
        updatedBy: space!.createdBy,
        author: {
          connect: {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            id: space!.createdBy
          }
        }
      }
    };

    if (node.type.match('card')) {

      const cardBlock = node.blocks?.card;

      if (cardBlock) {
        cardBlock.id = newId;
        cardBlock.rootId = newParentId as string;
        cardBlock.parentId = newParentId as string;
        // eslint-disable @typescript-eslint/no-non-null-assertion
        cardBlock.updatedAt = undefined as any;
        cardBlock.createdAt = undefined as any;
        cardBlock.updatedBy = space!.createdBy;
        cardBlock.createdBy = space!.createdBy;
        cardBlock.spaceId = space!.id;

        pageArgs.push(newPageContent);
        blockArgs.push(cardBlock as Prisma.BlockCreateManyInput);

        node.children?.forEach(child => {
          recursivePagePrep({ node: child, newParentId: newId, rootSpacePermissionId });
        });

      }
    }
    else if (node.type.match('board')) {

      const boardBlock = node.blocks?.board;
      const viewBlocks = node.blocks?.views;

      if (boardBlock && !!viewBlocks?.length) {
        [boardBlock, ...viewBlocks].forEach(block => {
          if (block.type === 'board') {
            block.id = newId;
          }
          else {
            block.id = v4();
          }

          block.rootId = newId;
          block.parentId = block.type === 'board' ? '' : newId;
          // eslint-disable @typescript-eslint/no-non-null-assertion
          block.updatedAt = undefined as any;
          block.createdAt = undefined as any;
          block.createdBy = space!.createdBy;
          block.updatedBy = space!.updatedBy;
          block.spaceId = space!.id;
          blockArgs.push(block as Prisma.BlockCreateManyInput);
        });
        pageArgs.push(newPageContent);

        node.children?.forEach(child => {
          recursivePagePrep({ node: child, newParentId: newId, rootSpacePermissionId });
        });
      }
    }
    else if (node.type === 'page') {
      pageArgs.push(newPageContent);
      node.children?.forEach(child => {
        recursivePagePrep({ node: child, newParentId: newId, rootSpacePermissionId });
      });
    }
  }

  dataToImport.pages.forEach(page => {
    recursivePagePrep({ node: page, newParentId: null });
  });

  updateReferences({
    oldNewHashMap: oldNewHashmap,
    pages: flatPages
  });

  return {
    pageArgs,
    blockArgs: {
      data: blockArgs
    }
  };

}

export async function importWorkspacePages ({ targetSpaceIdOrDomain, exportData, exportName }: WorkspaceImport): Promise<WorkspaceImportResult> {
  const { pageArgs, blockArgs } = await generateImportWorkspacePages({ targetSpaceIdOrDomain, exportData, exportName });

  const pagesToCreate = pageArgs.length;

  let createdPages = 0;
  const createdBlocks = 0;

  await prisma.$transaction([
    ...pageArgs.map(p => {
      createdPages += 1;
      log.debug(`Creating page ${createdPages}/${pagesToCreate}: ${p.data.type} // ${p.data.title}`);
      return createPage(p);
    }),
    prisma.block.createMany(blockArgs)
  ]);

  //  const blocks = await prisma.block.createMany(blockArgs);

  return {
    pages: createdPages,
    blocks: createdBlocks
  };
}

