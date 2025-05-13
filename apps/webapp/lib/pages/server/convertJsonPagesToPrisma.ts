import fs from 'node:fs/promises';

import type { Block, Page, Prisma, Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { PageContent } from '@packages/charmeditor/interfaces';
import { extractPreviewImage } from '@packages/charmeditor/utils/extractPreviewImage';
import { v4 } from 'uuid';

interface AWSAssetUrl {
  oldPageId: string;
  newPageId: string;
  awsUrl: string;
}

export interface ConverterOutput {
  blocksToCreate: Prisma.BlockCreateInput[];
  pagesToCreate: Prisma.PageCreateInput[];
  oldNewHashmap: Record<string, string>;
  awsAssetUrls: AWSAssetUrl[];
}

/**
 * Processes the recursive folder structure created by export page data script and returns the data necessary for a prisma page transaction
 * @oldNewHashmap - A Handy tree structure that keeps a reference to the old and new page IDs. It can be accessed in both directions
 */
async function convertFolderContent({
  entryPath,
  spaceId,
  authorId,
  blocksToCreate,
  pagesToCreate,
  parentPageId,
  parentPermissionId,
  oldNewHashmap,
  awsAssetUrls
}: {
  parentPageId?: string | null;
  entryPath: string;
  spaceId: string;
  authorId: string;
  parentPermissionId?: string;
} & ConverterOutput): Promise<ConverterOutput> {
  // Find the JSON content for the page
  const folderContent = await fs.readdir(entryPath);

  const newPageId = v4();

  const pageContentPath = `${entryPath}/${folderContent.find((p) => p.match('json')) as string}`;

  const pageContent = JSON.parse(await fs.readFile(pageContentPath, 'utf8')) as Page;

  // Map the old page ID to the new one
  oldNewHashmap[pageContent.id] = newPageId;
  oldNewHashmap[newPageId] = pageContent.id;

  pageContent.id = newPageId;
  pageContent.galleryImage = extractPreviewImage(pageContent.content as PageContent);

  if (pageContent.type === 'board') {
    pageContent.boardId = pageContent.id;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {
    spaceId: droppedSpaceId,
    parentId,
    createdAt,
    createdBy,
    cardId,
    updatedAt,
    updatedBy,
    boardId: boardIdToDrop,
    ...prismaCreateInput
  } = pageContent;

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

  typedPrismaCreateInput.updatedBy = authorId;

  if (parentPageId) {
    typedPrismaCreateInput.parent = {
      connect: { id: parentPageId }
    };
  }

  // Re-add this once we re-create a formal relationship for a page and its children
  // typedPrismaCreateInput.parentPage = parentPageId ? {
  //   connect: {
  //     id: parentPageId
  //   }
  // } : undefined;

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
      sourcePermission: parentPermissionId
        ? {
            connect: {
              id: parentPermissionId
            }
          }
        : undefined
    }
  };

  if (!typedPrismaCreateInput.content) {
    typedPrismaCreateInput.content = undefined;
  }

  // Construct the blocks
  if (folderContent.some((f) => f === 'blocks')) {
    const blocksFolderPath = `${entryPath}/blocks`;

    const blocksFolder = await fs.readdir(blocksFolderPath);

    await Promise.all(
      blocksFolder.map(async (blockFile) => {
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

        const boardId = pageContent.type === 'board' ? newPageId : (parentPageId as string);

        typedBlock.rootId = boardId;

        if (typedBlock.type !== 'board') {
          typedBlock.parentId = boardId;
        } else {
          typedBlock.parentId = '';
          typedPrismaCreateInput.boardId = boardId;
        }

        // Assign the actual ID
        if (typedBlock.type === 'board') {
          typedBlock.id = newPageId;
        } else if (typedBlock.type === 'card') {
          typedBlock.id = newPageId;
          typedPrismaCreateInput.card = {
            connect: {
              id: newPageId
            }
          };
        } else {
          typedBlock.id = v4();
        }

        blocksToCreate.push(typedBlock);
      })
    );
  }

  pagesToCreate.push(typedPrismaCreateInput);

  // Parse the children and recursively invoke this function
  if (folderContent.some((f) => f === 'children')) {
    const childrenFolderPath = `${entryPath}/children`;

    const childrenFolder = await fs.readdir(childrenFolderPath);

    //    createManyPageInput.

    await Promise.all(
      childrenFolder.map((childFolder) => {
        const childFolderPath = `${childrenFolderPath}/${childFolder}`;

        return convertFolderContent({
          entryPath: childFolderPath,
          authorId,
          blocksToCreate,
          spaceId,
          pagesToCreate,
          parentPageId: newPageId,
          parentPermissionId: permissionId,
          oldNewHashmap,
          awsAssetUrls
        });
      })
    );
  }

  return {
    blocksToCreate,
    pagesToCreate,
    oldNewHashmap,
    awsAssetUrls
  };
}

/**
 * Use this to convert a static page tree to prisma input you can provide to a transaction
 * @folderPath The folder containing the exported pages for the target space
 * @findS3Assets Defaults to false - If enabled, will return all AWS S3 assets found in the page content, or the page header image
 */
export async function convertJsonPagesToPrisma({
  folderPath,
  spaceId,
  findS3Assets = false
}: {
  folderPath: string;
  spaceId: string;
  findS3Assets?: boolean;
}): Promise<Omit<ConverterOutput, 'oldNewHashmap'>> {
  const space = (await prisma.space.findUnique({
    where: {
      id: spaceId
    }
  })) as Space;

  const entryFolder = await fs.readdir(folderPath);

  const pagesToCreate: Prisma.PageCreateInput[] = [];
  const blocksToCreate: Prisma.BlockCreateInput[] = [];
  const oldNewHashmap: Record<string, string> = {};
  const awsAssetUrls: AWSAssetUrl[] = [];

  await Promise.all(
    entryFolder.map((pageFolder) =>
      convertFolderContent({
        authorId: space.createdBy,
        blocksToCreate,
        pagesToCreate,
        oldNewHashmap,
        entryPath: `${folderPath}/${pageFolder}`,
        spaceId,
        awsAssetUrls
      })
    )
  );

  // Assess the page content for any data we want to update
  pagesToCreate.forEach((p) => {
    const prosemirrorNodes = (p.content as PageContent)?.content;
    if (prosemirrorNodes) {
      let prosemirrorNodesAsText = JSON.stringify(prosemirrorNodes);

      // Step 1 - Update all nested page links
      const nestedPageRefs = prosemirrorNodesAsText.match(
        /{"type":"page","attrs":{"id":"((\d|[a-f]){1,}-){1,}(\d|[a-f]){1,}"}}/g
      );

      nestedPageRefs?.forEach((pageLinkNode) => {
        const oldPageId = pageLinkNode.match(/((\d|[a-f]){1,}-){1,}(\d|[a-f]){1,}/)?.[0];
        const newPageId = oldPageId ? oldNewHashmap[oldPageId] : undefined;

        if (oldPageId && newPageId) {
          prosemirrorNodesAsText = prosemirrorNodesAsText.replace(oldPageId, newPageId);
        }
      });

      (p.content as PageContent).content = JSON.parse(prosemirrorNodesAsText);

      // Step - 2 Extract any S3 URLs
      if (findS3Assets) {
        const awsUrlRegex = /https:\/\/s3\.amazonaws(\w|\d|-|\/|\.){1,}/g;

        const awsAssetLinksFound = prosemirrorNodesAsText.match(awsUrlRegex);

        const pageId = p.id as string;

        if (awsAssetLinksFound) {
          awsAssetUrls.push(
            ...awsAssetLinksFound.map((link) => {
              const assetUrl: AWSAssetUrl = {
                awsUrl: link,
                newPageId: pageId,
                oldPageId: oldNewHashmap[pageId]
              };
              return assetUrl;
            })
          );
        }

        if (p.headerImage && p.headerImage.match(awsUrlRegex) !== null) {
          awsAssetUrls.push({
            awsUrl: p.headerImage,
            newPageId: pageId,
            oldPageId: oldNewHashmap[pageId]
          });
        }
      }
    }
  });

  // Run post processing to update page references

  return {
    blocksToCreate,
    pagesToCreate,
    awsAssetUrls
  };
}
