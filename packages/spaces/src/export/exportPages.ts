import type { PageNodeWithChildren } from '@charmverse/core/pages';
import { resolvePageTree } from '@charmverse/core/pages';
import type { Block, Page, PagePermission } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { generateMarkdown } from '@packages/bangleeditor/markdown/generateMarkdown';
import type { PageContent, TextContent } from '@packages/charmeditor/interfaces';
import type { RelatedPageData } from '@packages/pages/interfaces';
import { isBoardPageType } from '@packages/pages/isBoardPageType';

import type { ZipFileNode } from './zipFiles';

function recurse(node: PageContent, cb: (node: PageContent | TextContent) => void) {
  if (node?.content) {
    node?.content.forEach((childNode) => {
      recurse(childNode, cb);
    });
  }
  if (node) {
    cb(node);
  }
}

export type ExportedPage = PageNodeWithChildren<
  Page & Partial<RelatedPageData> & { permissions: (PagePermission & { sourcePermission?: PagePermission | null })[] }
>;

export async function exportPages({ spaceId }: { spaceId: string }): Promise<ZipFileNode[]> {
  const space = await prisma.space.findUniqueOrThrow({
    where: { id: spaceId }
  });

  const rootPages = await prisma.page.findMany({
    where: {
      spaceId: space.id,
      parentId: null,
      deletedAt: null,
      type: {
        in: ['page', 'board', 'linked_board']
      }
    }
  });

  const exportData: ZipFileNode[] = [];

  // Replace by multi resolve page tree in future
  const mappedTrees = await Promise.all(
    rootPages.map(async (page) => {
      return resolvePageTree({
        pageId: page.id,
        findManyArgs: {
          select: {
            id: true,
            parentId: true,
            content: true,
            boardId: true,
            cardId: true,
            index: true,
            type: true,
            title: true
          }
        }
      });
    })
  );

  // Console reporting for manual exports
  // const pageIndexes = mappedTrees.reduce((acc, val) => {
  //   let pageCount = Object.keys(acc).length;

  //   [val.targetPage, ...val.flatChildren].forEach((p) => {
  //     pageCount += 1;
  //     acc[p.id] = pageCount;
  //   });

  //   return acc;
  // }, {} as Record<string, number>);

  /**
   * Mutates the given node to provision its block data
   */
  async function recursiveResolveBlocks({ node }: { node: PageNodeWithChildren<ExportedPage> }): Promise<void> {
    // Generate markdown for the page
    const markdown = node.content ? await generateMarkdown({ content: node.content as PageContent }) : undefined;

    if (isBoardPageType(node.type)) {
      const boardblocks = await prisma.block.findMany({
        where: {
          rootId: node.id as string,
          type: {
            in: ['board', 'view']
          }
        }
      });

      node.blocks = {
        board: boardblocks.find((block) => block.type === 'board') as Block,
        views: boardblocks.filter((block) => block.type === 'view') as Block[]
      };
    }

    await Promise.all(
      (node.children ?? []).map(async (child) => {
        await recursiveResolveBlocks({ node: child });
      })
    );

    Object.assign(node as unknown as ZipFileNode, {
      markdown
    });

    const zipFields = ['markdown', 'tsv', 'children', 'title'];

    // Save memory: clear out node and replace with zip file node contents
    Object.keys(node).forEach((key) => {
      if (node.hasOwnProperty(key) && !zipFields.includes(key)) {
        delete node[key as keyof typeof node];
      }
    });
  }

  await Promise.all(mappedTrees.map((tree) => recursiveResolveBlocks({ node: tree.targetPage })));

  mappedTrees.forEach((t) => {
    exportData.push(t.targetPage);
  });

  return exportData;
}
