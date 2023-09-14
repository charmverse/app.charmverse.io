import { prisma } from '@charmverse/core/prisma-client';
import { emptyDocument } from 'lib/prosemirror/constants';
import { BlockNode, PageContent } from 'lib/prosemirror/interfaces';
import { writeToSameFolder } from 'lib/utilities/file';
import { pageTree } from '@charmverse/core/pages/utilities';
import { PageMeta } from '@charmverse/core/dist/cjs/pages';

export function recurseDocument(content: PageContent, cb: (node: PageContent) => void) {
  function recurse(node: PageContent) {
    cb(node);

    if (node.content) {
      node.content.forEach((childNode) => {
        recurse(childNode);
      });
    }
  }

  recurse(content);
}

export async function updatePageContentForSync() {
  const pages = await prisma.page.findMany({
    select: {
      id: true,
      content: true,
    }
  })

  const errors: { pageId: string, error: any }[] = []

  for (const page of pages) {
    try {
      const childPages = await prisma.page.findMany({
        where: {
          parentId: page.id,
        },
        select: {
          id: true,
          index: true,
          createdAt: true,
          path: true,
          type: true,
        }
      });

      const sortedChildPages = pageTree.sortNodes(childPages as PageMeta[]);

      const childPageIds = sortedChildPages.map((childPage) => childPage.id);

      const pageContent = (page.content ?? emptyDocument) as PageContent;
      const nestedPageIds: Set<string> = new Set();

      recurseDocument(pageContent, (node) => {
        if (node.type === "page" && node.attrs) {
          const pageId = node.attrs.id;
          if (!childPageIds.includes(pageId) || nestedPageIds.has(pageId)) {
            node.type = "page-link";
          } else {
            nestedPageIds.add(pageId);
          }
        }
      })

      const childPagesNotInDocument = childPages.filter((childPage) => !nestedPageIds.has(childPage.id));

      childPagesNotInDocument.forEach(childPage => {
        (pageContent.content as BlockNode[]).push({
          type: "page",
          attrs: {
            id: childPage.id,
            path: childPage.path,
            type: childPage.type,
            track: []
          }
        })
      })

      await prisma.page.update({
        where: {
          id: page.id,
        },
        data: {
          content: pageContent,
        }
      })

      console.log(`Complete updating page ${page.id}`)
    } catch (error) {
      errors.push({ pageId: page.id, error });
    }
  }

  if (errors.length > 0) {
    await writeToSameFolder({
      fileName: 'updatePageContentForSyncErrors.json',
      data: JSON.stringify(errors, null, 2)
    })
  }
}

updatePageContentForSync();