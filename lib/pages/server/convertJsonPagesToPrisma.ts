import { Block, Page, Prisma, Space } from '@prisma/client';
import { prisma } from 'db';
import { PageContent } from 'models';
import fs from 'node:fs/promises';
import { v4 } from 'uuid';

interface ConverterOutput {
  blocksToCreate: Prisma.BlockCreateInput[],
  pagesToCreate: Prisma.PageCreateInput[],
  oldNewHashmap: Record<string, string>
}

/**
 * Processes the recursive folder structure created by export page data script and returns the data necessary for a prisma page transaction
 * @oldNewHashmap - A Handy tree structure that keeps a reference to the old and new page IDs
 */
async function convertFolderContent ({ entryPath, spaceId, authorId, blocksToCreate, pagesToCreate, parentPageId, parentPermissionId, oldNewHashmap }:
  {
    parentPageId?: string | null,
    entryPath: string,
    spaceId: string,
    authorId: string,
    parentPermissionId?: string
  } & ConverterOutput): Promise<ConverterOutput> {
  // Find the JSON content for the page
  const folderContent = await fs.readdir(entryPath);

  const newPageId = v4();

  const pageContentPath = `${entryPath}/${folderContent.find(p => p.match('json')) as string}`;

  const pageContent = JSON.parse(await fs.readFile(pageContentPath, 'utf8')) as Page;

  // Map the old page ID to the new one
  oldNewHashmap[pageContent.id] = newPageId;

  pageContent.id = newPageId;

  if (pageContent.type === 'board') {
    pageContent.boardId = pageContent.id;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { spaceId: droppedSpaceId, parentId, createdBy, cardId, boardId: boardIdToDrop, ...prismaCreateInput } = pageContent;

  const typedPrismaCreateInput = prismaCreateInput as any as Prisma.PageCreateInput;

  typedPrismaCreateInput.space = {
    connect: {
      id: spaceId
    }
  };

  typedPrismaCreateInput.author = {
    connect: {
      id: authorId
    }
  };

  typedPrismaCreateInput.parentPage = parentPageId ? {
    connect: {
      id: parentPageId
    }
  } : undefined;

  // Leave this empty for now, we'll reassign later
  typedPrismaCreateInput.card = undefined;
  typedPrismaCreateInput.boardId = undefined;

  const permissionId = v4();

  typedPrismaCreateInput.permissions = {
    create: {
      id: permissionId,
      permissionLevel: 'full_access',
      space: {
        connect: {
          id: spaceId
        }
      },
      sourcePermission: parentPermissionId ? {
        connect: {
          id: parentPermissionId
        }
      } : undefined
    }
  };

  if (!typedPrismaCreateInput.content) {
    typedPrismaCreateInput.content = undefined;
  }

  // Construct the blocks
  if (folderContent.some(f => f === 'blocks')) {
    const blocksFolderPath = `${entryPath}/blocks`;

    const blocksFolder = await fs.readdir(blocksFolderPath);

    await Promise.all(blocksFolder.map(async blockFile => {
      const blockFilePath = `${blocksFolderPath}/${blockFile}`;
      const blockData = JSON.parse(await fs.readFile(blockFilePath, 'utf8')) as Block;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { createdBy: createdByToDrop, spaceId: spaceIdToDrop, ...block } = blockData;

      const typedBlock = block as Prisma.BlockCreateInput;

      typedBlock.space = {
        connect: {
          id: spaceId
        }
      };

      typedBlock.user = {
        connect: {
          id: authorId
        }
      };

      const boardId = pageContent.type === 'board' ? newPageId : parentPageId as string;

      typedBlock.rootId = boardId;

      if (typedBlock.type !== 'board') {
        typedBlock.parentId = boardId;
      }
      else {
        typedBlock.parentId = '';
        typedPrismaCreateInput.boardId = boardId;
      }

      // Assign the actual ID
      if (typedBlock.type === 'board' || typedBlock.type === 'card') {
        typedBlock.id = newPageId;
      }
      else {
        typedBlock.id = v4();
      }

      blocksToCreate.push(typedBlock);

    }));

  }

  pagesToCreate.push(typedPrismaCreateInput);

  // Parse the children and recursively invoke this function
  if (folderContent.some(f => f === 'children')) {
    const childrenFolderPath = `${entryPath}/children`;

    const childrenFolder = await fs.readdir(childrenFolderPath);

    //    createManyPageInput.

    await Promise.all(childrenFolder.map(childFolder => {

      const childFolderPath = `${childrenFolderPath}/${childFolder}`;

      return convertFolderContent({
        entryPath: childFolderPath,
        authorId,
        blocksToCreate,
        spaceId,
        pagesToCreate,
        parentPageId: newPageId,
        parentPermissionId: permissionId,
        oldNewHashmap
      });
    }));

  }

  return {
    blocksToCreate,
    pagesToCreate,
    oldNewHashmap
  };

}

/**
 * Use this to convert a static page tree to prisma input you can provide to a transaction
 * @folderPath The folder containing the exported pages for the target space
 */
export async function convertJsonPagesToPrisma ({ folderPath, spaceId }:
  {
    folderPath: string, spaceId: string
  }): Promise<{pagesToCreate: Prisma.PageCreateInput[], blocksToCreate: Prisma.BlockCreateInput[]}> {
  const space = await prisma.space.findUnique({
    where: {
      id: spaceId
    }
  }) as Space;

  const entryFolder = await fs.readdir(folderPath);

  const pagesToCreate: Prisma.PageCreateInput[] = [];
  const blocksToCreate: Prisma.BlockCreateInput[] = [];
  const oldNewHashmap: Record<string, string> = {};

  await Promise.all(entryFolder.map(pageFolder => convertFolderContent({
    authorId: space.createdBy,
    blocksToCreate,
    pagesToCreate,
    oldNewHashmap,
    entryPath: `${folderPath}/${pageFolder}`,
    spaceId
  })));

  // Iterate through page links and update the reference
  pagesToCreate.forEach(p => {
    const prosemirrorNodes = (p.content as PageContent)?.content;
    if (prosemirrorNodes) {
      let prosemirrorNodesAsText = JSON.stringify(prosemirrorNodes);

      const nestedPageRefs = prosemirrorNodesAsText.match(/{"type":"page","attrs":{"id":"((\d|[a-f]){1,}-){1,}(\d|[a-f]){1,}"}}/g);

      nestedPageRefs?.forEach(pageLinkNode => {
        const oldPageId = pageLinkNode.match(/((\d|[a-f]){1,}-){1,}(\d|[a-f]){1,}/)?.[0];
        const newPageId = oldPageId ? oldNewHashmap[oldPageId] : undefined;

        if (oldPageId && newPageId) {
          prosemirrorNodesAsText = prosemirrorNodesAsText.replace(oldPageId, newPageId);
        }
      });

      (p.content as PageContent).content = JSON.parse(prosemirrorNodesAsText);
    }
  });

  // Run post processing to update page references

  return {
    blocksToCreate,
    pagesToCreate
  };
}
