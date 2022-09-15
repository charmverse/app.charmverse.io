import { Page, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { getPagePath } from 'lib/pages/utils';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { typedKeys } from 'lib/utilities/objects';
import { PageContent } from 'models';
import fs from 'node:fs/promises';
import path from 'node:path';
import { v4, validate } from 'uuid';
import { ExportedPage, WorkspaceExport, WorkspaceImport } from './interfaces';

interface UpdateRefs {
  oldNewHashMap: Record<string, string>,
  pages: Page[]
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
Promise<{pageArgs: Prisma.PageCreateArgs[], blockArgs: Prisma.BlockCreateManyArgs}> {
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

  // 2 way hashmap to find link between new and old page ids
  const oldNewHashmap: Record<string, string> = {
  };

  /**
   * Mutates the pages, updating their ids
   */
  function recursivePagePrep ({ node }: {node: ExportedPage}) {
    const newId = v4();

    oldNewHashmap[newId] = node.id;
    oldNewHashmap[node.id] = newId;

    node.id = newId;

    flatPages.push(node);

    const { children, permissions, createdBy, spaceId, cardId, proposalId, bountyId, blocks, ...pageWithoutJoins } = node;

    typedKeys(pageWithoutJoins).forEach(key => {
      if (pageWithoutJoins[key] == null) {
        delete pageWithoutJoins[key];
      }
    });

    pageArgs.push({
      data: {
        ...pageWithoutJoins,
        content: node.content as Prisma.InputJsonValue ?? undefined,
        path: getPagePath(),
        space: {
          connect: {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            id: space!.id
          }
        },
        author: {
          connect: {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            id: space!.createdBy
          }
        }
      }
    });

    node.children?.forEach(child => {
      child.parentId = newId;
      recursivePagePrep({ node: child });
    });
  }

  dataToImport.pages.forEach(page => {
    recursivePagePrep({ node: page });
  });

  updateReferences({
    oldNewHashMap: oldNewHashmap,
    pages: flatPages
  });

  return {
    pageArgs,
    blockArgs: {
      data: []
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
      // eslint-disable-next-line no-console
      console.log(`Creating page ${createdPages}/${pagesToCreate}: ${p.data.type} // ${p.data.title}`);
      return prisma.page.create(p);
    })
  ]);

  //  const blocks = await prisma.block.createMany(blockArgs);

  return {
    pages: createdPages,
    blocks: createdBlocks
  };
}

