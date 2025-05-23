import { log } from '@charmverse/core/log';
import type { PageNodeWithChildren } from '@charmverse/core/pages';
import { resolvePageTree } from '@charmverse/core/pages';
import { prisma } from '@charmverse/core/prisma-client';
import { generateMarkdown } from '@packages/bangleeditor/markdown/generateMarkdown';
import type { PageContent, TextContent } from '@packages/charmeditor/interfaces';
import { loadAndGenerateCsv } from '@packages/databases/generateCsv';
import type { RelatedPageData } from '@packages/pages/interfaces';
import { isBoardPageType } from '@packages/pages/isBoardPageType';

import type { ZipFileNode } from './zipFiles';

const zipFields: (keyof ZipFileNode)[] = ['markdown', 'tsv', 'children', 'title'];

export async function exportPages({ spaceId, userId }: { spaceId: string; userId: string }): Promise<ZipFileNode[]> {
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
  async function recursiveResolveBlocks({
    node
  }: {
    node: PageNodeWithChildren<{ id: string; content: any }>;
  }): Promise<void> {
    // Generate markdown for the page
    let markdown: string | undefined;
    if (node.content) {
      try {
        markdown = await generateMarkdown({ content: node.content as PageContent });
      } catch (error) {
        log.error('Error generating markdown for page', { pageId: node.id, error });
        markdown = 'There was an error generating markdown for this page';
      }
    }

    if (isBoardPageType(node.type)) {
      const { csvData } = await loadAndGenerateCsv({
        userId,
        databaseId: node.id
      });

      Object.assign(node as unknown as ZipFileNode, {
        tsv: csvData
      });
    }

    await Promise.all(
      (node.children ?? []).map(async (child) => {
        await recursiveResolveBlocks({ node: child });
      })
    );

    Object.assign(node as unknown as ZipFileNode, {
      markdown
    });

    // Save memory: clear out node and replace with zip file node contents
    Object.keys(node).forEach((key) => {
      if (node.hasOwnProperty(key) && !zipFields.includes(key as keyof ZipFileNode)) {
        delete node[key as keyof typeof node];
      }
    });
  }

  await Promise.all(
    mappedTrees.map((tree) =>
      recursiveResolveBlocks({ node: tree.targetPage as unknown as PageNodeWithChildren<{ id: string; content: any }> })
    )
  );

  mappedTrees.forEach((t) => {
    exportData.push(t.targetPage as unknown as ZipFileNode);
  });

  return exportData;
}
